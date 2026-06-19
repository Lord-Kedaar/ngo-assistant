#!/usr/bin/env python3
"""
index_embeddings.py — Per-language embedding indexer.

Builds one SQLite file per language under data/vector/embeddings-{lang}.sqlite3
so that retrieval in one language never touches embeddings of another.

Usage:
    python3 backend/scripts/index_embeddings.py --lang pl
    python3 backend/scripts/index_embeddings.py --lang all    # pl + en + de
"""
import argparse
import json
import os
import re
import sqlite3
import sys
import time
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DOCS_ROOT = PROJECT_ROOT / "data" / "source_documents"
VECTOR_DIR = PROJECT_ROOT / "data" / "vector"

OMLX_URL = os.environ.get("OMLX_BASE_URL", "http://127.0.0.1:18585/v1").rstrip("/")
OMLX_KEY = os.environ.get("OMLX_API_KEY", "")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "bge-m3-mlx-4bit")
EMBED_DIMS = 1024
CHUNK_SIZE = 700


def embed(text: str) -> list[float]:
    if not OMLX_URL.endswith("/embeddings"):
        url = OMLX_URL + ("/v1/embeddings" if not OMLX_URL.endswith("/v1") else "/embeddings")
    else:
        url = OMLX_URL
    payload = {"model": EMBEDDING_MODEL, "input": text}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {OMLX_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())["data"][0]["embedding"]


def chunk_sections(path: Path, lang: str):
    txt = path.read_text(encoding="utf-8")
    title_m = re.search(r"^#\s+(.+)$", txt, re.M)
    doc_title = title_m.group(1) if title_m else path.stem
    sections = re.split(r"(?m)^##\s+", txt)
    for i, sec in enumerate(sections[1:] or [txt]):
        lines = sec.splitlines()
        st = lines[0].strip() if lines else path.stem
        body = "\n".join(lines[1:]).strip()
        if len(body) <= 30:
            continue
        full = f"Dokument: {doc_title}\nSekcja: {st}\n{body}"
        if len(full) <= CHUNK_SIZE:
            yield {
                "lang": lang, "filename": path.name, "section": st,
                "document_title": doc_title, "source_label": f"{path.name} — {st}",
                "text": full, "chunk_index": 0, "total_chunks": 1,
            }
        else:
            words = full.split()
            chunk_idx = 0
            for start in range(0, len(words), CHUNK_SIZE // 5):
                chunk_words = words[start:start + CHUNK_SIZE // 5]
                chunk_text = " ".join(chunk_words)
                if len(chunk_text) < 100:
                    break
                yield {
                    "lang": lang, "filename": path.name,
                    "section": f"{st} (cz. {chunk_idx + 1})",
                    "document_title": doc_title,
                    "source_label": f"{path.name} — {st}",
                    "text": chunk_text, "chunk_index": chunk_idx, "total_chunks": -1,
                }
                chunk_idx += 1


def init_db(lang: str) -> sqlite3.Connection:
    db_path = VECTOR_DIR / f"embeddings-{lang}.sqlite3"
    if db_path.exists():
        db_path.unlink()  # rebuild from scratch — vector_rag assumes a clean DB
    VECTOR_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lang TEXT, filename TEXT, section TEXT, document_title TEXT,
            source_label TEXT, text TEXT, embedding TEXT,
            chunk_index INTEGER, indexed_at TEXT
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_filename ON chunks(filename)")
    conn.commit()
    return conn


def index_lang(lang: str) -> int:
    source_dir = DOCS_ROOT / lang
    if not source_dir.exists():
        print(f"[index:{lang}] source dir missing: {source_dir}")
        return 0
    files = sorted(source_dir.glob("*.md"))
    if not files:
        print(f"[index:{lang}] no *.md files found")
        return 0
    conn = init_db(lang)
    total = 0
    print(f"[index:{lang}] {len(files)} files")
    for path in files:
        chunks = list(chunk_sections(path, lang))
        print(f"  {path.name}: {len(chunks)} chunks", end="", flush=True)
        for chunk in chunks:
            for attempt in range(3):
                try:
                    emb = embed(chunk["text"])
                    break
                except Exception as exc:
                    if attempt == 2:
                        print(f" [EMBED ERROR after 3 retries: {exc}]", end="", flush=True)
                        emb = None
                        break
                    time.sleep(2 ** attempt)
            if emb is None:
                continue
            conn.execute(
                "INSERT INTO chunks(lang,filename,section,document_title,"
                "source_label,text,embedding,chunk_index,indexed_at) "
                "VALUES(?,?,?,?,?,?,?,?,datetime('now'))",
                (chunk["lang"], chunk["filename"], chunk["section"],
                 chunk["document_title"], chunk["source_label"], chunk["text"],
                 json.dumps(emb), chunk["chunk_index"]),
            )
            total += 1
        conn.commit()
        print(" ✓")
    conn.close()
    print(f"[index:{lang}] {total} chunks indexed")
    return total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default="all",
                        help="language code (pl/en/de) or 'all'")
    args = parser.parse_args()
    if args.lang == "all":
        langs = sorted(d.name for d in DOCS_ROOT.iterdir() if d.is_dir())
    else:
        langs = [args.lang]
    grand = 0
    for lang in langs:
        grand += index_lang(lang)
    print(f"\n✅ Done. {grand} chunks indexed across {len(langs)} languages.")


if __name__ == "__main__":
    main()
