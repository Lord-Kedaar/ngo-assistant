#!/usr/bin/env bash
set -euo pipefail
lsof -tiTCP:8088 -sTCP:LISTEN | xargs -r kill
