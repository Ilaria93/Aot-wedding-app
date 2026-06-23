#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

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

VENV_PREFIX="$(./venv/bin/python -c "import sys; print(sys.prefix)" 2>/dev/null || true)"
EXPECTED_PREFIX="$BACKEND_DIR/venv"
if [ "$VENV_PREFIX" != "$EXPECTED_PREFIX" ]; then
  echo "Il virtualenv backend non punta a questa cartella, lo ricreo..."
  rm -rf venv
  python3 -m venv venv
fi

venv_entrypoints_work() {
  ./venv/bin/alembic --version >/dev/null 2>&1 && ./venv/bin/uvicorn --version >/dev/null 2>&1
}

if ! venv_entrypoints_work || ! ./venv/bin/python -c "import alembic, psycopg" >/dev/null 2>&1; then
  if [ -d "venv" ] && ! venv_entrypoints_work; then
    echo "Gli script del virtualenv puntano a un percorso vecchio, lo ricreo..."
    rm -rf venv
    python3 -m venv venv
  fi
  echo "Installo le dipendenze backend..."
  ./venv/bin/pip install -r requirements.txt
fi

postgres_is_ready() {
  ./venv/bin/python -c "
from psycopg import connect
from settings import read_database_url

database_url = read_database_url().replace('postgresql+psycopg://', 'postgresql://', 1)
with connect(database_url, connect_timeout=2):
    pass
" >/dev/null 2>&1
}

wait_for_postgres() {
  local attempts=0
  until postgres_is_ready; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 90 ]; then
      echo "PostgreSQL non risponde su 127.0.0.1:5432."
      return 1
    fi
    sleep 1
  done
}

ensure_postgres() {
  if postgres_is_ready; then
    echo "PostgreSQL gia attivo su 127.0.0.1:5432."
    return 0
  fi

  if command -v docker >/dev/null 2>&1; then
    echo "Avvio PostgreSQL locale con Docker..."
    docker compose -f "$COMPOSE_FILE" up -d postgres
    echo "Attendo che PostgreSQL sia pronto..."
    wait_for_postgres
    return 0
  fi

  cat <<'EOF'
PostgreSQL non e in esecuzione e Docker non e installato (o non e nel PATH).

Scegli una di queste opzioni:

1) Docker Desktop (consigliato per il progetto)
   - Installa Docker Desktop per Mac: https://www.docker.com/products/docker-desktop/
   - Avvia Docker Desktop, poi rilancia: ./scripts/run-backend.sh

2) PostgreSQL con Homebrew (senza Docker)
   brew install postgresql@16
   brew services start postgresql@16
   createuser -s postgres || true
   psql postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" || true
   createdb aot_wedding_app || true
   createdb aot_wedding_app_test || true
   Poi rilancia: ./scripts/run-backend.sh

Credenziali attese in backend/.env:
  DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/aot_wedding_app
EOF
  exit 1
}

ensure_postgres

echo "Verifico che i database PostgreSQL esistano..."
./venv/bin/python -c "from database.postgres_admin import ensure_default_databases_exist; ensure_default_databases_exist()"

echo "Applico le migrazioni Alembic..."
./venv/bin/python -c "from database.alembic_bootstrap import reconcile_stale_alembic_version; reconcile_stale_alembic_version()"
./venv/bin/alembic -c alembic.ini upgrade head

echo "Avvio backend su http://127.0.0.1:8000"
exec ./venv/bin/uvicorn main:app --reload
