# NGO Local Knowledge Assistant Demo

Publiczny demonstrator lokalnego asystenta wiedzy dla fikcyjnej NGO Fundacja Mosty Sasiadzkie.

## Demo Purpose

Demonstruje lokalny system RAG oparty na dokumentach organizacji pozarzadowej.
Uzytkownik zadaje pytanie, system wyszukuje najlepszy passus w dokumentacji
zrodlowej i zwraca go wraz ze zrodlem - bez generatywnego LLM w trybie domyslnym.

Tryb odpowiedzi: Extractive Answer Mode
Backend nie wywoluje modelu jezykowego (LLM) do generowania odpowiedzi.
Zamiast tego zwraca najlepszy pasujacy fragment dokumentu wraz z cytatem.
complete() w omlx_client.py jest zachowane na potrzeby przyszlego trybu generatywnego.

## Architecture

Browser (React/Vite, port 5173 / preview 4173)
  | /api/* proxy
FastAPI backend (port 8088)
  - quota module, RAG (Chroma), omlx_client (reserved for generative mode)
  | localhost:18585 oMLX tunnel
oMLX / local LLM (gemma-4-12B-it-nvfp4) (optional)

## Requirements

- Python 3.10+
- Node.js 18+
- npm
- (optional) oMLX-compatible local LLM server on localhost:18585

## Local Setup

```bash
# 1. Backend
python -m venv .venv && . .venv/bin/activate
pip install -r backend/requirements.txt

# 2. Frontend
cd frontend && npm install && npm run build && cd ..

# 3. Ingest documents
python backend/scripts/ingest_documents.py

# 4. Run
uvicorn backend.app.main:app --host 127.0.0.1 --port 8088
cd frontend && npm run preview
```

## Makefile Commands

- make backend-check - Syntax check Python modules
- make frontend-check - TypeScript type check
- make test - Run backend tests (pytest)
- make build - Frontend build
- make healthcheck - GET /api/health against running backend
- make run-backend - Start FastAPI server
- make run-frontend-preview - Start Vite preview server

## Tests

```bash
python -m pytest backend/tests/ -v
```
Expected: 10 passed (3 warnings about deprecated Starlette API are benign).

## Frontend Build

```bash
cd frontend
npm run typecheck   # tsc -b
npm run build       # tsc -b && vite build
npm run preview     # vite preview
```

## Deployment Overview

Stack: FastAPI + React/Vite + Chroma (SQLite) + Cloudflare Tunnel

- Backend runs as a user-level systemd service on Lenovo Server.
- Frontend assets served from frontend/dist/ (static mount).
- Public URL via Cloudflare Tunnel.
- APP_ENV=production - fail-fast if cookie_secret or hmac_secret
  are left at default (change-me or empty).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 503 Model unavailable | Start oMLX; check SSH tunnel localhost:18585 |
| 422 Validation error | Question must be 3-400 chars |
| Empty sources returned | Chunk score below threshold - try different phrasing |
| Backend wont start in production | Set APP_ENV=production and provide real secrets |

## Privacy

Nie wpisuj danych osobowych. Demo nie zapisuje tresci pytan
(store_query_content=false). Sesje identyfikowane tylko przez losowy
cookie - bez logowania, bez kont.

## Secrets

W trybie produkcyjnym aplikacja odmowi startu jesli cookie_secret
lub hmac_secret sa puste lub rowne change-me.

.env (production):
APP_ENV=production
COOKIE_SECRET=<generate-secure-string>
HMAC_SECRET=<generate-secure-string>

## Status

- Build: PASS
- Tests: 10/10 PASS
- Deployed publicly: see docs/PHASE_6_DEPLOYMENT_PLAN.md
