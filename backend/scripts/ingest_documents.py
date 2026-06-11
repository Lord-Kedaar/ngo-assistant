import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2 if 'backend/scripts' in __file__ else 1]))
from backend.app.rag import rag
rag.load()
print(f"Indexed chunks={len(rag.chunks)}")
