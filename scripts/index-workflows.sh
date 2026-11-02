#!/usr/bin/env bash
# Index all workflows (recursively) into a catalog database.
#
#   ./scripts/index-workflows.sh python          # incremental
#   ./scripts/index-workflows.sh python --force  # re-analyze everything
#   ./scripts/index-workflows.sh node
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK="${1:-python}"
shift || true

case "$STACK" in
  python)
    export PYTHONPATH="$ROOT/services/python${PYTHONPATH:+:$PYTHONPATH}"
    export N8N_DB_PATH="${N8N_DB_PATH:-$ROOT/data/python/workflows.db}"
    exec python3 -m catalog.cli.index "$@"
    ;;
  node)
    export N8N_DB_PATH="${N8N_DB_PATH:-$ROOT/data/node/workflows.db}"
    exec node "$ROOT/services/node/catalog/src/cli/index.js" "$@"
    ;;
  *)
    echo "Usage: $0 {python|node} [--force] [--stats]" >&2
    exit 2
    ;;
esac
