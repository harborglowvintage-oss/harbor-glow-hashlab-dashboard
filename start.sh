#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8100}"

if [[ -x "$PROJECT_ROOT/.venv/bin/uvicorn" ]]; then
    UVICORN_CMD="$PROJECT_ROOT/.venv/bin/uvicorn"
else
    UVICORN_CMD="python3 -m uvicorn"
fi

export PYTHONPATH="$PROJECT_ROOT:${PYTHONPATH:-}"
exec $UVICORN_CMD main:app --host "$HOST" --port "$PORT"
