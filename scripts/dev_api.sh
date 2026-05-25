#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

free_uvicorn_port() {
  local listener_pids attached_pids pids
  listener_pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  attached_pids="$(lsof -tiTCP:"$PORT" 2>/dev/null || true)"
  pids="$(printf "%s\n%s\n" "$listener_pids" "$attached_pids" | sort -u | sed '/^$/d')"

  for pid in $pids; do
    local command
    command="$(ps -p "$pid" -o command= 2>/dev/null || true)"

    if [[ "$command" == *uvicorn* || "$command" == *python* ]]; then
      echo "Stopping stale API process on port $PORT: PID $pid"
      kill "$pid" 2>/dev/null || true
    elif printf "%s\n" "$listener_pids" | grep -qx "$pid"; then
      echo "Port $PORT is in use by a non-API process:"
      echo "  PID $pid: $command"
      echo "Stop it manually or choose another port with PORT=8001 npm run dev:api"
      exit 1
    fi
  done

  sleep 1
}

free_uvicorn_port

cd "$API_DIR"

if [[ -x "venv/bin/uvicorn" ]]; then
  UVICORN="venv/bin/uvicorn"
else
  UVICORN="uvicorn"
fi

"$UVICORN" app.main:app --host "$HOST" --port "$PORT" --reload &
SERVER_PID="$!"

cleanup() {
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo
    echo "Stopping API server..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT
wait "$SERVER_PID"
