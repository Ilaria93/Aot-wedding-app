#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

cd "$BACKEND_DIR"

if [ ! -f ".env" ]; then
  cp env.example .env
  echo "Creato backend/.env da env.example"
  echo "Ricordati di impostare JWT_SECRET_KEY in backend/.env"
fi

if [ ! -d "venv" ]; then
  echo "Creo il virtualenv backend..."
  python3 -m venv venv
fi

if [ ! -x "./venv/bin/uvicorn" ]; then
  echo "Installo le dipendenze backend..."
  ./venv/bin/pip install -r requirements.txt
fi

echo "Avvio backend su http://127.0.0.1:8000"
exec ./venv/bin/uvicorn main:app --reload
