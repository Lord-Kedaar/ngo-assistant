"""
vector_rag.py — Per-language embedding-aware RAG retriever.

Architecture:
  - One SQLite file per language under data/vector/embeddings-{lang}.sqlite3
  - BM25 candidates are fetched from MultiLangRAG (which already isolates
    per-language indices) for the same language as the question.
  - Query is embedded via oMLX bge-m3 and reranked against the same
    language's chunk embeddings (cosine similarity).
  - Final score = 0.6 * vector_similarity + 0.4 * (bm25 / bm25_max).
  - If the per-language DB is missing or oMLX is unreachable, falls back
    to BM25-only results so the demo never hard-fails on a missing index.
"""
import json
import math
import sqlite3
from pathlib import Path

from .settings import settings
from .rag import multi_rag, _is_generic_section, _norm

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
VECTOR_DIR = PROJECT_ROOT / "data" / "vector"
EMBED_DIMS = 1024


def _lang_db_path(lang: str) -> Path:
    return VECTOR_DIR / f"embeddings-{lang}.sqlite3"


def _cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb + 1e-10)


class VectorRAG:
    def __init__(self):
        self._conns: dict[str, sqlite3.Connection] = {}
        self._ready: dict[str, bool] = {}

    def load(self) -> None:
        """Open per-language DB connections lazily. Safe to call multiple times."""
        for lang in settings.available_languages:
            self._open_lang(lang)

    def _open_lang(self, lang: str) -> None:
        if lang in self._conns:
            return
        path = _lang_db_path(lang)
        if not path.exists():
            self._ready[lang] = False
            return
        try:
            conn = sqlite3.connect(str(path))
            conn.row_factory = sqlite3.Row
            count = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
            self._conns[lang] = conn
            self._ready[lang] = count > 0
            if count:
                print(f"[VectorRAG:{lang}] loaded {count} chunks")
            else:
                print(f"[VectorRAG:{lang}] DB empty")
        except Exception as exc:  # pragma: no cover — defensive
            print(f"[VectorRAG:{lang}] DB error: {exc}")
            self._ready[lang] = False

    def _ensure_lang(self, lang: str) -> bool:
        if lang not in self._conns:
            self._open_lang(lang)
        return self._ready.get(lang, False)

    # ------------------------------------------------------------------ embed

    def embed(self, text: str) -> list[float]:
        import urllib.request as req

        base = settings.omlx_base_url.rstrip("/")
        if base.endswith("/v1"):
            url = f"{base}/embeddings"
        else:
            url = f"{base}/v1/embeddings"
        payload = {"model": settings.embedding_model, "input": text}
        req_obj = req.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.omlx_api_key}",
            },
        )
        with req.urlopen(req_obj, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        return body["data"][0]["embedding"]

    # ----------------------------------------------------------------- search

    def search(self, q: str, lang: str = "pl", top_k: int | None = None) -> list:
        top_k = top_k or settings.retrieval_top_k

        # Step 1 — BM25 candidates from the per-language index.
        bm25_candidates = multi_rag.search(q, lang, top_k=top_k * 4)

        if not self._ensure_lang(lang) or not self._conns.get(lang):
            return bm25_candidates[:top_k]

        # Step 2 — embed the query.
        try:
            q_emb = self.embed(q)
        except Exception as exc:  # pragma: no cover — network failure path
            print(f"[VectorRAG:{lang}] embed failed: {exc}")
            return bm25_candidates[:top_k]

        # Step 3 — load all chunks for this language only.
        rows = self._conns[lang].execute(
            "SELECT id, filename, section, document_title, source_label, "
            "text, embedding FROM chunks"
        ).fetchall()
        if not rows:
            return bm25_candidates[:top_k]

        # Step 4 — cosine similarity over the language's chunks.
        scored = []
        for row in rows:
            emb = json.loads(row["embedding"])
            sim = _cosine(q_emb, emb)
            scored.append((sim, row))
        scored.sort(key=lambda x: x[0], reverse=True)
        vector_top = scored[: top_k * 3]

        # Step 5 — combine with BM25 scores for the same filename+section.
        bm25_by_key: dict[tuple[str, str], float] = {}
        for sc, chunk in bm25_candidates:
            key = (chunk["filename"], chunk["section_title"])
            bm25_by_key[key] = max(bm25_by_key.get(key, 0.0), sc)
        bm25_max = max(bm25_by_key.values()) if bm25_by_key else 1.0

        def _is_generic(sec: str) -> bool:
            return _is_generic_section(lang, sec)

        reranked = []
        for vec_sim, row in vector_top:
            key = (row["filename"], row["section"])
            bm25_norm = bm25_by_key.get(key, 0.0) / bm25_max
            final = vec_sim * 0.6 + bm25_norm * 0.4
            if _is_generic(row["section"]):
                final *= 0.15
            reranked.append((final, row))
        reranked.sort(key=lambda x: x[0], reverse=True)

        # If the top hit lands on a generic section (e.g. "Example
        # operational questions"), walk down the list and pick the next
        # chunk from the same document with a concrete section, as long as
        # it is within 75% of the top score.
        if reranked and _is_generic(reranked[0][1]["section"]):
            top_score = reranked[0][0]
            top_file = reranked[0][1]["filename"]
            swap = None
            for sc, row in reranked[1:]:
                if row["filename"] == top_file and not _is_generic(row["section"]) \
                        and sc >= top_score * 0.75:
                    swap = (sc, row)
                    break
            if swap is not None:
                reranked = [swap] + [(s, r) for s, r in reranked
                                      if (s, r) != swap]

        result = []
        for final_sc, row in reranked[:top_k]:
            result.append((final_sc, {
                "text": row["text"],
                "filename": row["filename"],
                "section_title": row["section"],
                "document_title": row["document_title"],
                "source_label": row["source_label"],
                "document_version": "1.0",
                "updated_at": "2026-03-15",
            }))
        return result


vector_rag = VectorRAG()
