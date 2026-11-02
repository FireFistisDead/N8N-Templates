#!/usr/bin/env bash
# Start the Node public gateway (serves the client, proxies /api to the catalog).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GATEWAY_DIR="$ROOT/services/node/gateway"

if [ ! -d "$GATEWAY_DIR/node_modules" ]; then
  (cd "$GATEWAY_DIR" && npm install --no-audit --no-fund)
fi

export GATEWAY_HOST="${GATEWAY_HOST:-127.0.0.1}"
export GATEWAY_PORT="${GATEWAY_PORT:-8001}"
export CATALOG_URL="${CATALOG_URL:-http://127.0.0.1:8102}"

cd "$GATEWAY_DIR"
exec node src/index.js "$@"
