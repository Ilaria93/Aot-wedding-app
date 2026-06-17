#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "Test backend..."
cd "$BACKEND_DIR"
if [ ! -x "./venv/bin/pytest" ]; then
  echo "Esegui prima ./scripts/run-backend.sh per creare il virtualenv."
  exit 1
fi
./venv/bin/pytest -q

echo ""
echo "Test frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  npm install
fi
npm test

echo ""
echo "Tutti i test completati."
