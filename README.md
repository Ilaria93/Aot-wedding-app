# AOT Wedding App

Piattaforma matrimonio web responsive con estetica Attack on Titan.

**Stack:** React + Vite · FastAPI + SQLAlchemy · PostgreSQL (Docker)

**Feature:** account con ruoli, inviti RSVP, album foto con moderazione, travel hub contatti logistica, i18n (`it`, `en`, `fr`, `de`).

## Struttura

```
backend/     routes, services, models, schemas, tests
frontend/    pages, components, services, i18n (Vite + React Router)
.cursor/     regole Cursor per sviluppo assistito da AI
scripts/     run-backend.sh · run-frontend.sh · run-dev.sh · run-tests.sh
```

**Architettura:** BE `routes → services → models` · FE `pages → components → services` (API). Ruoli: `guest`, `admin`, `bride`, `groom`.

## Avvio rapido

```bash
./scripts/run-dev.sh
```

| Script | Cosa fa |
|--------|---------|
| `run-dev.sh` | Backend + frontend Vite (`Ctrl+C` ferma entrambi) |
| `run-backend.sh` | `.env`, `venv`, PostgreSQL, migrazioni, `uvicorn` |
| `run-frontend.sh` | `.env`, dipendenze, dev server Vite (porta 5173) |
| `run-tests.sh` | `pytest` backend + `vitest` frontend |

API: [localhost:8000/docs](http://127.0.0.1:8000/docs) · App: [localhost:5173](http://localhost:5173) · RSVP test: `/rsvp/{token}`

---

## Backend

```bash
cd backend
docker compose up -d postgres
cp env.example .env          # imposta JWT_SECRET_KEY
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/alembic -c alembic.ini upgrade head
./venv/bin/uvicorn main:app --reload
```

DB sviluppo: `aot_wedding_app` · DB test: `aot_wedding_app_test`

In Swagger: **Authorize** → incolla `access_token` da login/register.

**Test:**

```bash
./scripts/run-tests.sh
```

Oppure separatamente:

```bash
cd backend && ./venv/bin/pytest -q
cd frontend && npm test
```

---

## Frontend

Backend su porta `8000`, poi:

```bash
cd frontend
cp env.example .env
npm install
npm run dev
```

Test RSVP: `POST /guest/create-invite` (admin su Swagger) → `http://localhost:5173/rsvp/YOUR_TOKEN`

---

## API

Swagger: [localhost:8000/docs](http://127.0.0.1:8000/docs)

| Endpoint | Note |
|----------|------|
| `GET /health` | Healthcheck |
| `POST /auth/register` · `/login` · `/refresh` · `/logout` | Sessione JWT |
| `GET /auth/me` · `PATCH /auth/me` | Profilo |
| `POST /guest/create-invite` | Admin — crea invito |
| `GET /guest/{token}` | Lookup ospite |
| `POST /rsvp/confirm` · `GET /rsvp/by-token/{token}` | RSVP |
| `GET /photos` · `POST /photos/upload-intent` · `POST /photos/complete-upload` | Album |
| `GET /contacts` | Contatti pubblici |
| `GET /admin/guests` · `GET /admin/rsvp-stats` | Admin |
| `GET /admin/photos` · `PATCH /admin/photos/{id}` | Moderazione foto |
| `GET/POST/PATCH/DELETE /admin/contacts` | Gestione contatti |

Route **admin** richiedono bearer token con ruolo `admin`, `bride` o `groom`.

---

## Convenzioni codice

- **Diff minimi** — modifica solo ciò che serve alla richiesta
- **FE:** componenti &lt; 150 righe, JSDoc su export, testi da `i18n`, colori da `aotTheme`, API solo in `services/`
- **BE:** route sottili, logica in `services/`, commento su ogni handler, Pydantic per I/O
- **Test:** nuova route → `backend/tests/`; logica FE → `cd frontend && npm test`
- **UI:** semplice, spaziature generose, stati loading/errore/vuoto sempre gestiti

Regole dettagliate per Cursor: `.cursor/rules/` (sempre attive).

---

## Contribuire

1. `./scripts/run-dev.sh` per verificare in locale
2. `pytest` verde se tocchi il backend
3. Nuove stringhe UI in tutte e 4 le lingue
4. Migrazione Alembic se cambia lo schema DB
5. Nessun segreto in commit (`.env`, token)
