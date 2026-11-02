#!/usr/bin/env bash
# Rebuild context categories with the Node worker.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/services/node/categorizer"
exec node src/index.js --workflows "$ROOT/workflows" --context "$ROOT/context" "$@"
