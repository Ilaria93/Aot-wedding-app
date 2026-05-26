#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

cd "$FRONTEND_DIR"

if [ ! -f ".env" ]; then
  cp env.example .env
  echo "Creato frontend/.env da env.example"
fi

if [ ! -d "node_modules" ]; then
  echo "Installo le dipendenze frontend..."
  npm install
fi

echo "Avvio frontend Expo Web..."
exec npm run web
