# NGO Local Knowledge Assistant Demo

Publiczny demonstrator lokalnego asystenta wiedzy dla fikcyjnej NGO „Fundacja Mosty Sąsiedzkie”.

## Run
`python -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt`
`cd frontend && npm install && npm run build`
`python backend/scripts/ingest_documents.py`
`python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8088`
