#!/usr/bin/env bash
# Development convenience: run the Python catalog + gateway together.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

./scripts/catalog-python.sh &
CATALOG_PID=$!

cleanup() {
  kill "$CATALOG_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for the catalog to answer before exposing the gateway.
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${CATALOG_PORT:-8101}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

./scripts/gateway-python.sh
