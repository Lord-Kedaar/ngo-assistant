#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python backend/scripts/ingest_documents.py
