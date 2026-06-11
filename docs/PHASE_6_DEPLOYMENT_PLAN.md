# PHASE 6 — Plan wdrożenia Fedora

Status: przygotowano pliki, niczego nie instalowano na serwerze.

## Warunek startu FAZY 7
Lenovo Server musi odpowiadać przez SSH pod LAN `192.168.8.112` albo Tailscale `100.79.95.68`. W pierwszym discovery użyto błędnego adresu `192.168.0.165`; korekta: właściwe adresy to `192.168.8.112` / `100.79.95.68`.

## Komendy planowane po zgodzie
```bash
ssh radek@192.168.8.112 'hostname && python3 --version && node --version && tailscale version'
rsync -az --delete --exclude .env --exclude .venv --exclude node_modules --exclude data/chroma --exclude data/quota ./ radek@192.168.8.112:/opt/ngo-local-knowledge-assistant-demo/
ssh radek@192.168.8.112 'cd /opt/ngo-local-knowledge-assistant-demo && python3 -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt'
ssh radek@192.168.8.112 'cd /opt/ngo-local-knowledge-assistant-demo/frontend && npm install && npm run build'
ssh radek@192.168.8.112 'cd /opt/ngo-local-knowledge-assistant-demo && . .venv/bin/activate && python backend/scripts/ingest_documents.py'
sudo cp deploy/systemd/ngo-ai-demo.service /etc/systemd/system/
sudo cp deploy/systemd/ngo-ai-omlx-tunnel.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ngo-ai-omlx-tunnel.service
sudo systemctl enable --now ngo-ai-demo.service
curl -fsS http://127.0.0.1:8088/api/health
```

## Tailscale Funnel po osobnej zgodzie
Najpierw:
```bash
tailscale version
tailscale funnel --help
```
Potem, jeśli lokalne CLI potwierdza składnię:
```bash
sudo tailscale funnel --bg 8088
```

## Rollback
```bash
sudo systemctl disable --now ngo-ai-demo.service ngo-ai-omlx-tunnel.service
sudo rm -f /etc/systemd/system/ngo-ai-demo.service /etc/systemd/system/ngo-ai-omlx-tunnel.service
sudo systemctl daemon-reload
sudo tailscale funnel reset
mv /opt/ngo-local-knowledge-assistant-demo /opt/ngo-local-knowledge-assistant-demo.rollback-$(date +%Y%m%d-%H%M%S)
```

## Zakazy utrzymane
Bez zgody nie instalować pakietów systemowych, nie zmieniać SSH, Tailscale, firewalld, systemd ani oMLX.
