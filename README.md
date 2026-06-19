# NGO Local Knowledge Assistant

> A fully local, multilingual RAG (Retrieval-Augmented Generation) assistant for NGO knowledge management — powered by open-source LLMs, semantic embeddings, and zero cloud dependencies.

**Stack:** FastAPI · React/Vite · oMLX (local LLM) · SQLite · BM25 + Embedding Hybrid RAG

---

## Features

- **🌐 Trilingual interface** — Polish, English, German with automatic language detection (`Accept-Language` header) and manual switcher
- **🧠 Generative answers** — LLM-generated responses grounded in retrieved document context (Gemma-4-26B via oMLX)
- **🔍 Hybrid semantic search** — BM25 lexical retrieval + cosine similarity embedding reranking (bge-m3-mlx) for precision
- **📁 30 curated documents** — translated into PL/EN/DE, covering NGO operations, volunteering, finance, events, and policies
- **🔒 Fully offline** — all inference and embeddings run on local hardware; zero data leaves the server
- **⚡ Fast response** — sub-second retrieval with streaming-capable generation pipeline
- **🛡️ Privacy-first** — configurable `store_query_content=false`, session identified by random cookie only

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ / npm
- oMLX-compatible LLM server (recommended: Mac Studio M2 Max)

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Copy and edit configuration
cp .env.example .env
# Set OMLX_BASE_URL, GENERATIVE_MODE=true, etc.

# Ingest vector embeddings
python backend/scripts/index_embeddings.py

# Start the API server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8088
```

### Frontend

```bash
cd frontend
npm install
npm run build     # production build → frontend/dist/
npm run preview   # preview server on :4173
```

### Docker

```bash
docker compose up --build
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  React/Vite App (port 4173)                                 │
│  - LanguageSwitcher (PL/EN/DE)                              │
│  - useLocales hook                                          │
│  - /api/* proxy to backend                                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────┐
│               FastAPI Backend (port 8088)                    │
│                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ MultiLangRAG│  │  VectorRAG   │  │  oMLX Client       │   │
│  │ (lang route)│  │(BM25+embed)  │  │  (chat/embed)      │   │
│  └────────────┘  └──────┬───────┘  └─────────┬──────────┘   │
│                          │                    │              │
│  ┌───────────────────────▼────────────────────▼──────────┐   │
│  │              Data Layer                               │   │
│  │  data/source_documents/{pl,en,de}/  (30 .md files)    │   │
│  │  data/vector/*.db              (SQLite embeddings)    │   │
│  │  data/quota/*.db              (rate limiting)         │   │
│  └───────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ SSH tunnel (18585 → 8585)
┌────────────────────▼────────────────────────────────────────┐
│              oMLX Server (Mac Studio M2 Max)                │
│  - gemma-4-26B-A4B-it-QAT        (chat completions)        │
│  - bge-m3-mlx-4bit               (embeddings)              │
│  - Multi-model mode on port 8585                            │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|---|---|---|
| `backend/app/main.py` | FastAPI endpoints, language routing, session management | API layer |
| `backend/app/rag.py` | `MultiLangRAG` — BM25 lexical search with language awareness | Base retrieval |
| `backend/app/vector_rag.py` | `VectorRAG` — hybrid BM25 + embedding reranking | Semantic retrieval |
| `backend/app/omlx_client.py` | OpenAI-compatible client for oMLX API | LLM inference |
| `backend/app/settings.py` | Pydantic-settings configuration | App config |
| `backend/app/translations.py` | i18n strings for PL/EN/DE UI | Localization |
| `backend/scripts/index_embeddings.py` | Chunk source docs, compute embeddings, store in SQLite | Indexing pipeline |
| `frontend/src/` | React app with TypeScript, CSS, locale system | User interface |

---

## Configuration

All configuration via environment variables (`.env` file):

| Variable | Default | Description |
|---|---|---|
| `OMLX_BASE_URL` | `http://127.0.0.1:8585/v1` | oMLX API endpoint |
| `OMLX_MODEL` | `gemma-4-26B-A4B-it-QAT-MLX-4bit` | LLM for generative answers |
| `EMBEDDING_MODEL` | `bge-m3-mlx-4bit` | Model for embedding computation |
| `GENERATIVE_MODE` | `true` | `true` = LLM-generated answers; `false` = raw excerpt |
| `AVAILABLE_LANGUAGES` | `pl,en,de` | Comma-separated enabled languages |
| `DEFAULT_LANGUAGE` | `pl` | Fallback language |
| `STORE_QUERY_CONTENT` | `false` | Whether to persist user questions |
| `COOKIE_SECRET` | — | Session cookie signing key (required in production) |
| `HMAC_SECRET` | — | HMAC signing key (required in production) |
| `APP_ENV` | `development` | `production` enables fail-fast secret validation |

---

## API

### `POST /api/chat`

Send a question and receive an answer grounded in the NGO knowledge base.

**Request:**
```json
{
  "question": "How do I start volunteering?",
  "session_id": "abc123"
}
```

**Response (generative mode):**
```json
{
  "answer": "To start volunteering with Fundacja Mosty Sąsiedzkie...",
  "source": "02_podrecznik_wolontariusza.md — Wprowadzenie do wolontariatu",
  "lang": "en",
  "session_id": "abc123",
  "retrieval": "hybrid",
  "quota_remaining": 48
}
```

### `GET /api/health`

```json
{
  "status": "ok",
  "generative": true,
  "model": "gemma-4-26B-A4B-it-QAT-MLX-4bit",
  "embedding": true
}
```

---

## Testing

```bash
# Backend tests (10 tests)
pytest backend/tests/ -v

# Frontend type check
cd frontend && npm run typecheck

# Full build verification
make build && make test && make healthcheck
```

All tests run locally with no external dependencies. The test suite covers:

- API endpoint validation (200, 422, 503 responses)
- Language routing (PL/EN/DE Accept-Language header)
- Session management and quota enforcement
- Retrieval quality across all three languages

---

## Deployment

### Production Stack

- **Backend:** systemd service (`ngo-ai-demo.service`) on Lenovo Server (Ubuntu)
- **LLM:** oMLX on Mac Studio M2 Max (64 GB) connected via SSH tunnel
- **Frontend:** Static SPA served via FastAPI static mount
- **Public URL:** Cloudflare Tunnel (optional)

### Steps

```bash
# On the server
cp .env.example .env    # set APP_ENV=production + secrets
sudo systemctl enable --now ngo-ai-demo.service

# Verify
curl http://localhost:8088/api/health
```

See [docs/PHASE_6_DEPLOYMENT_PLAN.md](./docs/PHASE_6_DEPLOYMENT_PLAN.md) for the full deployment guide.

---

## Project Structure

```
ngo-local-knowledge-assistant-demo/
├── backend/
│   ├── app/              # FastAPI application
│   │   ├── main.py       # API endpoints & routing
│   │   ├── rag.py        # BM25 multilingual retriever
│   │   ├── vector_rag.py # Hybrid semantic retriever
│   │   ├── omlx_client.py# oMLX LLM client
│   │   ├── settings.py   # Pydantic config
│   │   ├── translations.py # i18n strings
│   │   └── translations/ # JSON locale files
│   ├── scripts/           # Indexing & maintenance
│   ├── tests/             # Pytest suite
│   └── requirements.txt
├── frontend/
│   ├── src/               # React/TypeScript app
│   │   ├── components/    # UI components
│   │   ├── locales/       # Frontend translations
│   │   └── hooks/         # Custom hooks (useLocales)
│   └── package.json
├── data/
│   └── source_documents/  # {pl,en,de}/ — 30 markdown files
├── docs/                  # Documentation
├── Makefile               # Build & dev commands
├── docker-compose.yml     # Container setup
└── README.md
```

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgments

- Built with [oMLX](https://github.com/radiosilence/omlx) for local LLM inference
- Embedding model: [bge-m3-mlx](https://huggingface.co/mlx-community/bge-m3-mlx-4bit)
- LLM: [Gemma-4-26B](https://huggingface.co/mlx-community/gemma-4-26B-A4B-it-QAT-MLX-4bit)
- Vector similarity via `sqlite3` + NumPy

---

*Maintained by [Radosław Pleskot](https://radoslaw-pleskot.com)*
