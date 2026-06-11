# Handoff Report

## Co zbudowano
Repozytorium `ngo-local-knowledge-assistant-demo` z demonstratorem lokalnego asystenta wiedzy dla fikcyjnej Fundacji Mosty Sąsiedzkie: dokumenty syntetyczne, backend FastAPI, frontend React/Vite, limit 5 pytań, odmowy pozazakresowe, źródła odpowiedzi, skrypty operacyjne i plan wdrożenia Fedora/Tailscale Funnel.

## Komendy lokalne
```bash
cd /Users/radek/Documents/Projects/ngo-local-knowledge-assistant-demo
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
cd frontend && npm install && npm run build && cd ..
python backend/scripts/ingest_documents.py
OMLX_BASE_URL=http://127.0.0.1:8585/v1 python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8088
```

## Status wdrożenia
- Publiczny URL: nieutworzony.
- Tailscale Funnel: nieaktywny.
- systemd: pliki przygotowane, nieinstalowane.
- SSH tunnel: plik przygotowany, nieaktywny.
- Lenovo Server: pierwszy test użył błędnego adresu; właściwe adresy do ponownego testu to LAN `192.168.8.112` lub Tailscale `100.79.95.68`.
- Model: `gemma-4-12B-it-nvfp4`.
- Thinking OFF: wymaga potwierdzenia presetem oMLX, jeśli parametr API `thinking:false` nie wystarczy.

## Wyniki testów
Patrz `docs/TEST_REPORT.md`: pytest 4/4, ingest 50 chunków, frontend build OK, health/chat/quota/robots smoke OK lokalnie.

## Wyłączenie demo po wdrożeniu
```bash
sudo systemctl stop ngo-ai-demo.service
sudo systemctl stop ngo-ai-omlx-tunnel.service
sudo tailscale funnel reset
```

## Rzeczy celowo niezrobione
Nie instalowano pakietów systemowych, nie aktywowano SSH, nie zmieniano oMLX, nie zmieniano firewalld, nie instalowano systemd, nie uruchomiono Funnel, nie tworzono panelu admin ani uploadu dokumentów.
