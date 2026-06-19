"""
vector_rag.py — Embedding-aware RAG retriever
Hybryda: BM25 candidates + embedding rerank (z SQlite DB)
"""
import json, math, sqlite3
from pathlib import Path
from .settings import settings
from .rag import multi_rag, SimpleRAG

DB_PATH = Path(__file__).resolve().parent.parent / "data/vector/embeddings.sqlite3"
EMBED_DIMS = 1024

def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb + 1e-10)

class VectorRAG:
    def __init__(self):
        self.conn = None
        self._ready = False

    def load(self):
        if DB_PATH.exists():
            try:
                self.conn = sqlite3.connect(str(DB_PATH))
                self.conn.row_factory = sqlite3.Row
                count = self.conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
                self._ready = count > 0
                print(f"[VectorRAG] loaded {count} chunks")
            except Exception as e:
                print(f"[VectorRAG] DB error: {e}")
                self._ready = False
        else:
            print("[VectorRAG] vector DB not found, falling back to BM25")

    def embed(self, text: str) -> list[float]:
        """Get embedding from oMLX"""
        import urllib.request as req
        payload = {"model": settings.embedding_model, "input": text}
        r = req.urlopen(req.Request(
            settings.omlx_base_url.replace("/v1", "/v1/embeddings"),
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {settings.omlx_api_key}"},
        ), timeout=30)
        return json.loads(r.read().decode())["data"][0]["embedding"]

    def search(self, q: str, lang: str = "pl", top_k: int = None) -> list:
        top_k = top_k or settings.retrieval_top_k

        # 1. BM25 candidates (fast pre-filter)
        bm25_candidates = multi_rag.search(q, lang, top_k=top_k * 4)

        if not self._ready or not self.conn:
            return bm25_candidates[:top_k]

        # 2. Get query embedding
        try:
            q_emb = self.embed(q)
        except Exception:
            return bm25_candidates[:top_k]

        # 3. Retrieve vector chunks from DB for this language
        rows = self.conn.execute(
            "SELECT id, filename, section, document_title, source_label, text, embedding FROM chunks WHERE lang=?",
            (lang,)
        ).fetchall()
        if not rows:
            return bm25_candidates[:top_k]

        # 4. Score by cosine similarity
        scored = []
        for row in rows:
            emb = json.loads(row["embedding"])
            sim = _cosine(q_emb, emb)
            scored.append((sim, row))

        scored.sort(key=lambda x: x[0], reverse=True)
        vector_top = scored[:top_k * 3]

        # 5. Rerank: combine BM25 score + vector similarity
        bm25_by_file = {}
        for sc, chunk in bm25_candidates:
            key = (chunk["filename"], chunk["section_title"])
            bm25_by_file[key] = max(bm25_by_file.get(key, 0), sc)

        bm25_max = max(bm25_by_file.values()) if bm25_by_file else 1.0

        reranked = []
        for vec_sim, row in vector_top:
            key = (row["filename"], row["section"])
            bm25 = bm25_by_file.get(key, 0)
            final = vec_sim * 0.6 + (bm25 / bm25_max) * 0.4
            reranked.append((final, row))

        reranked.sort(key=lambda x: x[0], reverse=True)

        # Map back to chunk dict format for compatibility
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
