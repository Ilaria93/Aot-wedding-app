# AOT Wedding App

Cross-platform wedding platform inspired by Attack on Titan aesthetics.

## Current stack

- Frontend: Expo (React Native + web, to be implemented)
- Backend: FastAPI + SQLAlchemy
- Local DB: SQLite (`backend/wedding.db`)

## Project structure

- `backend/` API, models, schemas, services, tests
- `frontend/` Expo client (placeholder for now)
- `docs/` project notes and documentation

## Backend quick start

1. Go to backend directory:

```bash
cd backend
```

2. Configure environment variables:

```bash
cp env.example .env
# Edit .env and set a strong ADMIN_API_KEY (required).
```

3. Create and activate a virtual environment, then install dependencies:

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

You can also export variables in the shell instead of using `.env`:

```bash
export ADMIN_API_KEY='local-dev-secret-change-me'
```

For local development, `settings.py` picks sensible default browser origins if `CORS_ALLOW_ORIGINS` is omitted. Override with a comma-separated list when your Expo or Vite URL differs.

4. Run the API:

```bash
./venv/bin/uvicorn main:app --reload
```

5. Open API docs:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

In Swagger UI, open **Authorize** (lock icon), enter your `ADMIN_API_KEY` in the API key field, then call protected endpoints. Authorization persists while the docs tab stays open (`persistAuthorization`).

Protected routes require header `X-Admin-Api-Key` matching `ADMIN_API_KEY`:

- `POST /guest/create-invite`
- `GET /admin/guests`
- `GET /admin/rsvp-stats`

## Implemented API endpoints

- `GET /health` healthcheck
- `POST /guest/create-invite` create guest + invitation token (requires `X-Admin-Api-Key`)
- `GET /guest/{token}` get guest by invitation token
- `POST /rsvp/confirm` submit RSVP
- `GET /rsvp/by-token/{token}` read RSVP status by invitation token
- `GET /admin/guests` list all guests with RSVP status (requires `X-Admin-Api-Key`)
- `GET /admin/rsvp-stats` aggregated RSVP statistics (requires `X-Admin-Api-Key`)

## Backend tests

Run tests from `backend/`:

```bash
./venv/bin/pytest
```

Current coverage includes:
- invite creation + guest lookup flow
- RSVP lookup before and after confirmation
- admin guest list with and without RSVP

## Frontend tests plan

Recommended sequence once Expo is scaffolded:

1. Build first RSVP flow screen on web targets
2. Add component tests (`@testing-library/react-native` pattern) for core widgets
3. Use Detox-style E2E for native bundles only when critical flows stabilize
