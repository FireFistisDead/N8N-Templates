#!/bin/sh
# Render free tier spins down services independently on idle, and a sleeping
# service only wakes on a direct external request - not on another Render
# service's internal proxy call. Running catalog in-process here means one
# external hit (to the gateway) wakes everything, instead of the gateway
# waking up and finding a still-sleeping catalog on the other end.
set -e

if [ "${RENDER_COMBINED:-false}" = "true" ]; then
  python3 -m catalog &
  CATALOG_PID=$!
  trap 'kill "$CATALOG_PID" 2>/dev/null || true' EXIT INT TERM

  echo "Waiting for embedded catalog to become healthy..."
  for _ in $(seq 1 60); do
    if python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${CATALOG_PORT:-8101}/health', timeout=2)" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

exec python3 -m gateway
