#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-3000}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:${API_PORT}}"
NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
NEXT_BIN="$ROOT_DIR/node_modules/.bin/next"

cd "$ROOT_DIR"

if [[ ! -x "$NEXT_BIN" ]]; then
  echo "Next.js was not found. Run npm install, then try npm start again."
  exit 127
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Starting Postgres..."
  if ! docker compose up -d postgres; then
    echo "Could not start Postgres with Docker Compose."
    echo "Continuing anyway; make sure DATABASE_URL is reachable."
  fi
else
  echo "Docker Compose was not found; assuming Postgres is already running."
fi

PIDS=()

cleanup() {
  echo
  echo "Stopping LaunchPad dev servers..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait "${PIDS[@]}" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Starting API on http://localhost:${API_PORT}"
PORT="$API_PORT" bash scripts/dev_api.sh &
PIDS+=("$!")

echo "Starting web app on http://localhost:${WEB_PORT}"
(
  cd "$ROOT_DIR/apps/web"
  NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    NEXT_TELEMETRY_DISABLED="$NEXT_TELEMETRY_DISABLED" \
    "$NEXT_BIN" dev -p "$WEB_PORT"
) &
PIDS+=("$!")

while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"
      exit "$?"
    fi
  done
  sleep 1
done
