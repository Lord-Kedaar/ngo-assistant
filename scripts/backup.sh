#!/usr/bin/env bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S); mkdir -p backups; zip -r "backups/ngo-demo-$TS.zip" . -x "*.env" "*node_modules*" "*.venv*" "*data/chroma*" "*data/quota*"
