# Test Report

Data: 2026-06-11

## Środowisko
- Mac Studio, macOS 26.5.
- Python venv lokalny w repo.
- Frontend: Vite/React/TypeScript.
- oMLX smoke lokalnie: `http://127.0.0.1:8585/v1`, model `gemma-4-12B-it-nvfp4`.
- Docelowy Lenovo tunnel `127.0.0.1:18585` nieaktywny lokalnie, bo Lenovo jest niedostępny.

## Wyniki
- `python -m pytest -q`: 4 passed.
- `python backend/scripts/ingest_documents.py`: Indexed chunks=50.
- `npm run build`: OK, wygenerowano `frontend/dist`.
- `GET /api/health` z `OMLX_BASE_URL=http://127.0.0.1:8585/v1`: model_available=true.
- `POST /api/chat` pozytywne pytanie o projektor: HTTP 200, odpowiedź ze źródłami.
- pytanie negatywne o pogodę: odmowa bez calla do RAG/LLM path po prefilterze.
- limit sesji z cookie jar: pytania 1–5 HTTP 200, 6. pytanie HTTP 429.
- `GET /robots.txt`: `Disallow: /`.

## Problemy / ograniczenia
- Pierwszy test użył błędnego adresu Lenovo. Po korekcie właściwe adresy to LAN `192.168.8.112` i Tailscale `100.79.95.68`; connectivity/SSH działa przez Tailscale. Systemd, SSH tunnel i Tailscale Funnel nadal nie były aktywowane, bo to wymaga osobnej zgody.
- Thinking OFF: backend wysyła `thinking:false`; jeżeli oMLX wymaga presetu GUI, potrzebna ręczna weryfikacja.
- RAG jest obecnie lekki keyword-based, zgodny z małym demonstratorem; Chroma/sentence-transformers są wpisane w plan i requirements, ale bez aktywacji na Lenovo nie wykonywano docelowego PersistentClient.

## Potwierdzenie ekspozycji
Aplikacja nie wystawia oMLX publicznie. Backend wywołuje oMLX server-side; publiczny Funnel nie został uruchomiony.
