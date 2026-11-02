#!/usr/bin/env bash
# Rebuild context/search_categories.json + unique_categories.json (Python worker).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PYTHONPATH="$ROOT/services/python${PYTHONPATH:+:$PYTHONPATH}"
exec python3 -m categorizer --workflows "$ROOT/workflows" --context "$ROOT/context" "$@"
