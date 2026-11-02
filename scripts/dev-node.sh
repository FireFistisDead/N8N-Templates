#!/usr/bin/env bash
# Development convenience: run the Node catalog + gateway together.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

./scripts/catalog-node.sh &
CATALOG_PID=$!

cleanup() {
  kill "$CATALOG_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${CATALOG_PORT:-8102}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

./scripts/gateway-node.sh
