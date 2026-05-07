# AOT Wedding App

Cross-platform wedding platform inspired by Attack on Titan aesthetics.

## Current stack

- Frontend: Flutter (web + mobile, to be implemented)
- Backend: FastAPI + SQLAlchemy
- Local DB: SQLite (`backend/wedding.db`)

## Project structure

- `backend/` API, models, schemas, services, tests
- `frontend/` Flutter app (placeholder for now)
- `doc/` project notes and documentation

## Backend quick start

1. Go to backend directory:

```bash
cd backend
```

2. Install dependencies inside venv:

```bash
./venv/bin/pip install fastapi uvicorn sqlalchemy pydantic httpx pytest
```

3. Run the API:

```bash
./venv/bin/uvicorn main:app --reload
```

4. Open API docs:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Implemented API endpoints

- `GET /health` healthcheck
- `POST /guest/create-invite` create guest + invitation token
- `GET /guest/{token}` get guest by invitation token
- `POST /rsvp/confirm` submit RSVP
- `GET /rsvp/by-token/{token}` read RSVP status by invitation token

## Backend tests

Run tests from `backend/`:

```bash
./venv/bin/pytest
```

Current coverage includes:
- invite creation + guest lookup flow
- RSVP lookup before and after confirmation

## Frontend tests plan

Frontend folder is still empty, so Playwright/Storybook setup now would be premature.
Recommended sequence:

1. Build first Flutter RSVP flow screen
2. Add Flutter widget tests for core widgets
3. Add Flutter integration tests for app flow
4. Add Playwright e2e only for deployed web flow (optional, later)

Storybook alternative for Flutter:
- Prefer `Widgetbook` for Flutter component catalog/testing.
