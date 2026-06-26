#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
STACK_PID=""
STARTED_STACK=0

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM

  if [ "$STARTED_STACK" -eq 1 ] && [ -n "$STACK_PID" ] && kill -0 "$STACK_PID" 2>/dev/null; then
    kill "$STACK_PID" 2>/dev/null || true
    wait "$STACK_PID" 2>/dev/null || true
  fi

  exit "$exit_code"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts=0

  echo "Attendo ${label} su ${url} ..."
  until curl -sf "$url" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 90 ]; then
      echo "${label} non risponde su ${url}."
      return 1
    fi
    sleep 1
  done
}

trap cleanup EXIT INT TERM

if ! curl -sf "${BACKEND_URL}/health" >/dev/null 2>&1; then
  echo "Stack non attivo — avvio run-dev.sh in background ..."
  "$ROOT_DIR/scripts/run-dev.sh" &
  STACK_PID=$!
  STARTED_STACK=1
  wait_for_url "${BACKEND_URL}/health" "backend"
  wait_for_url "${FRONTEND_URL}" "frontend"
else
  echo "Stack già attivo."
  wait_for_url "${FRONTEND_URL}" "frontend"
fi

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  npm install
fi

if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "node_modules/playwright-core/.local-browsers" ]; then
  echo "Installo browser Playwright (solo chromium) ..."
  npx playwright install chromium
fi

export PLAYWRIGHT_REUSE_SERVER=1
export PLAYWRIGHT_BASE_URL="$FRONTEND_URL"
export PLAYWRIGHT_API_URL="$BACKEND_URL"

npm run test:e2e
echo ""
echo "Playwright E2E completati."
