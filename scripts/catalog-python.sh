#!/usr/bin/env bash
# Start the Python catalog microservice (owns SQLite, indexing, search).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PYTHONPATH="$ROOT/services/python${PYTHONPATH:+:$PYTHONPATH}"
export CATALOG_HOST="${CATALOG_HOST:-127.0.0.1}"
export CATALOG_PORT="${CATALOG_PORT:-8101}"
export N8N_DB_PATH="${N8N_DB_PATH:-$ROOT/data/python/workflows.db}"

exec python3 -m catalog "$@"
