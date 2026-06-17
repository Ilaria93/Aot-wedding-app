#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
LEGACY_FRONTEND_DIR="$ROOT_DIR/frontend"

if [ -d "$WEB_DIR" ] && [ -f "$WEB_DIR/package.json" ]; then
  FRONTEND_DIR="$WEB_DIR"
  START_COMMAND="npm run dev"
  FRONTEND_LABEL="Vite web"
else
  FRONTEND_DIR="$LEGACY_FRONTEND_DIR"
  START_COMMAND="npm run web"
  FRONTEND_LABEL="Expo Web (legacy)"
fi

cd "$FRONTEND_DIR"

if [ ! -f ".env" ]; then
  cp env.example .env
  echo "Creato ${FRONTEND_DIR}/.env da env.example"
fi

if [ ! -d "node_modules" ]; then
  echo "Installo le dipendenze frontend..."
  npm install
fi

echo "Avvio frontend ${FRONTEND_LABEL}..."
exec $START_COMMAND
