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


## PHASE 7 attempt — blocker 2026-06-11

Validated Lenovo access via Tailscale `100.79.95.68`: SSH works, Python 3.14.5, Node v22.22.2, Tailscale 1.98.4. Staged project to `/home/radek/ngo-local-knowledge-assistant-demo.stage` without secrets.

Blocked before system installation:
- `sudo` on Lenovo requires an interactive password, so `/opt` install and system-level service activation cannot proceed from this non-interactive run.
- SSH from Lenovo to Mac Studio Tailscale IP `100.127.3.65` fails with `Connection refused`, so Mac Studio Remote Login/SSH is not active or not reachable on Tailscale. This blocks the required persistent SSH tunnel `127.0.0.1:18585 -> Mac 127.0.0.1:8585`.

Manual prerequisites before retry:
1. Enable Remote Login on Mac Studio: System Settings → General → Sharing → Remote Login → On; allow user `radek`.
2. On Lenovo, confirm: `ssh radek@100.127.3.65 'echo MAC_SSH_OK'`.
3. Either provide an interactive sudo session/password path for Lenovo or approve user-level deployment under `/home/radek/ngo-local-knowledge-assistant-demo` with `systemctl --user` instead of `/opt` + system services.
