#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python scripts/show_stats.py
