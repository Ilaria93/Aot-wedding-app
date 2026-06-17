#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$ROOT_DIR/scripts"
BACKEND_PID=""
FRONTEND_PID=""
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM

  if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi

  if [ -n "${FRONTEND_PID}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi

  wait "${BACKEND_PID}" 2>/dev/null || true
  wait "${FRONTEND_PID}" 2>/dev/null || true

  exit "${exit_code}"
}

wait_for_backend() {
  local attempts=0
  echo "Attendo che il backend risponda su ${BACKEND_URL}/health ..."

  until curl -sf "${BACKEND_URL}/health" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 90 ]; then
      echo "Il backend non risponde su ${BACKEND_URL}/health."
      return 1
    fi
    sleep 1
  done
}

trap cleanup EXIT INT TERM

echo "Avvio backend..."
"$SCRIPT_DIR/run-backend.sh" &
BACKEND_PID=$!

wait_for_backend

echo "Avvio frontend..."
"$SCRIPT_DIR/run-frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "Stack locale pronto:"
echo "  Frontend: ${FRONTEND_URL}"
echo "  API docs: ${BACKEND_URL}/docs"
echo "  Health:   ${BACKEND_URL}/health"
echo ""
echo "Backend PID: ${BACKEND_PID}"
echo "Frontend PID: ${FRONTEND_PID}"
echo "Premi Ctrl+C per fermare tutto."

while true; do
  if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
    wait "${BACKEND_PID}"
    break
  fi

  if ! kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    wait "${FRONTEND_PID}"
    break
  fi

  sleep 1
done
