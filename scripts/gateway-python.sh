#!/usr/bin/env bash
# Start the Python public gateway (serves the client, proxies /api to the catalog).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PYTHONPATH="$ROOT/services/python${PYTHONPATH:+:$PYTHONPATH}"
export GATEWAY_HOST="${GATEWAY_HOST:-127.0.0.1}"
export GATEWAY_PORT="${GATEWAY_PORT:-8000}"
export CATALOG_URL="${CATALOG_URL:-http://127.0.0.1:8101}"

exec python3 -m gateway "$@"
