from backend.app.rag import rag
rag.load()
print(f"Indexed chunks={len(rag.chunks)}")
