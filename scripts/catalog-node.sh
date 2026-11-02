#!/usr/bin/env bash
# Start the Node catalog microservice (requires Node 22.5+ for node:sqlite).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CATALOG_DIR="$ROOT/services/node/catalog"

if [ ! -d "$CATALOG_DIR/node_modules" ]; then
  (cd "$CATALOG_DIR" && npm install --no-audit --no-fund)
fi

export N8N_DB_PATH="${N8N_DB_PATH:-$ROOT/data/node/workflows.db}"
export CATALOG_HOST="${CATALOG_HOST:-127.0.0.1}"
export CATALOG_PORT="${CATALOG_PORT:-8102}"

cd "$CATALOG_DIR"
exec node src/index.js "$@"
