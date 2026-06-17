#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
  echo "Errore: frontend Vite non trovato in ${FRONTEND_DIR}"
  exit 1
fi

if [ ! -f ".env" ]; then
  cp env.example .env
  echo "Creato frontend/.env da env.example"
fi

if [ ! -d "node_modules" ]; then
  echo "Installo le dipendenze frontend..."
  npm install
fi

echo "Avvio frontend Vite su ${FRONTEND_URL}"
echo "Backend atteso in frontend/.env → VITE_API_URL (default http://127.0.0.1:8000)"
exec npm run dev
