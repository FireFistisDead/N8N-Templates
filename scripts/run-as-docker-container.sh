#!/usr/bin/env bash
# Build and start both stacks, then open the Python gateway.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker compose up -d --build

echo
echo "Python gateway: http://localhost:8000"
echo "Node gateway:   http://localhost:8001"
echo

if [[ "${OSTYPE:-}" == "darwin"* ]]; then
  open -a Safari http://localhost:8000
elif [[ "${OSTYPE:-}" == "msys" || "${OSTYPE:-}" == "cygwin" ]]; then
  start chrome http://localhost:8000
else
  echo "Open http://localhost:8000 in your browser."
fi
