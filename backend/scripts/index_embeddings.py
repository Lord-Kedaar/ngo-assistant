"""
index_embeddings.py — Indeksacja wektorowa dokumentów NGO Assistant
Używa: oMLX bge-m3 przez tunnel → local SQLite (naprawdę JSON column)
"""
import json, math, re, sys, time, sqlite3
from pathlib import Path

OMLX_URL = "http://127.0.0.1:18585/v1/embeddings"
OMLX_KEY = "0456"
EMBEDDING_MODEL = "bge-m3-mlx-4bit"
EMBED_DIMS = 1024
BASE_DIR = Path("/opt/ngo-local-knowledge-assistant-demo")
DOCS_ROOT = BASE_DIR / "data/source_documents"
DB_PATH = BASE_DIR / "data/vector/embeddings.sqlite3"
CHUNK_SIZE = 700  # chars per chunk (overlap ~100)

def embed(text: str) -> list[float]:
    import urllib.request
    payload = {"model": EMBEDDING_MODEL, "input": text}
    req = urllib.request.Request(
        OMLX_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {OMLX_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())["data"][0]["embedding"]

def chunk_sections(path: Path, lang: str):
    """Split document into chunks by section, sub-split large sections"""
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
        # Split large sections into sub-chunks
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
                    "lang": lang, "filename": path.name, "section": f"{st} (cz. {chunk_idx + 1})",
                    "document_title": doc_title, "source_label": f"{path.name} — {st}",
                    "text": chunk_text, "chunk_index": chunk_idx, "total_chunks": -1,
                }
                chunk_idx += 1

def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lang TEXT, filename TEXT, section TEXT, document_title TEXT,
            source_label TEXT, text TEXT, embedding TEXT,
            chunk_index INTEGER, indexed_at TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_lang ON chunks(lang)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_filename ON chunks(filename)")
    conn.commit()
    return conn

def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb + 1e-10)

def search(conn: sqlite3.Connection, q_embedding: list[float], lang: str = "pl", top_k: int = 4):
    rows = conn.execute(
        "SELECT id, lang, filename, section, source_label, text, embedding FROM chunks WHERE lang=?",
        (lang,)
    ).fetchall()
    scored = []
    for row in rows:
        ch_emb = json.loads(row[6])
        sim = cosine_similarity(q_embedding, ch_emb)
        scored.append((sim, row))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:top_k]

def main():
    conn = init_db()
    langs = sorted(d.name for d in DOCS_ROOT.iterdir() if d.is_dir())
    total = 0
    for lang in langs:
        source_dir = DOCS_ROOT / lang
        files = sorted(source_dir.glob("*.md"))
        print(f"\n=== {lang} ({len(files)} files) ===")
        for path in files:
            chunks = list(chunk_sections(path, lang))
            print(f"  {path.name}: {len(chunks)} chunks", end="", flush=True)
            for chunk in chunks:
                try:
                    emb = embed(chunk["text"])
                except Exception as e:
                    print(f" [EMBED ERROR: {e}]", end="", flush=True)
                    continue
                conn.execute(
                    "INSERT INTO chunks(lang,filename,section,document_title,source_label,text,embedding,chunk_index,indexed_at) VALUES(?,?,?,?,?,?,?,?,datetime('now'))",
                    (chunk["lang"], chunk["filename"], chunk["section"], chunk["document_title"],
                     chunk["source_label"], chunk["text"], json.dumps(emb), chunk["chunk_index"])
                )
                total += 1
            conn.commit()
            print(f" ✓")
    print(f"\n✅ Total: {total} chunks indexed")

if __name__ == "__main__":
    main()
