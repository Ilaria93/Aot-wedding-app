# AOT Wedding App

Cross-platform wedding platform inspired by Attack on Titan aesthetics.

## Current stack

- Frontend: Expo (React Native + web)
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
# Edit .env and set a strong JWT_SECRET_KEY (required).
# Also set ADMIN_ALLOWED_EMAILS with the auth emails that should become admins.
```

3. Create and activate a virtual environment, then install dependencies:

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

You can also export variables in the shell instead of using `.env`:

```bash
export JWT_SECRET_KEY='local-dev-secret-change-me'
export ADMIN_ALLOWED_EMAILS='example@test.app'
```

For local auth testing, any user registered with this email will receive the `admin` role:

- `example@test.app`

For local development, `settings.py` picks sensible default browser origins if `CORS_ALLOW_ORIGINS` is omitted. Override with a comma-separated list when your Expo or Vite URL differs.

4. Run the API:

```bash
./venv/bin/uvicorn main:app --reload
```

5. Open API docs:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

In Swagger UI, open **Authorize** (lock icon), register or log in via `/auth/register` or `/auth/login`, then paste the returned `access_token` as a bearer token. Authorization persists while the docs tab stays open (`persistAuthorization`).

Protected admin routes require a bearer token for a user whose email is listed in `ADMIN_ALLOWED_EMAILS`:

- `POST /guest/create-invite`
- `GET /admin/guests`
- `GET /admin/rsvp-stats`
- `GET /admin/photos`
- `GET /admin/contacts`

## Implemented API endpoints

- `GET /health` healthcheck
- `POST /auth/register` create account + initial session
- `POST /auth/login` log in and get access/refresh tokens
- `POST /auth/refresh` rotate refresh session
- `POST /auth/logout` revoke current refresh session
- `GET /auth/me` read current authenticated profile
- `PATCH /auth/me` update first and last name
- `POST /guest/create-invite` create guest + invitation token (requires admin bearer token)
- `GET /guest/{token}` get guest by invitation token
- `POST /rsvp/confirm` submit RSVP
- `GET /rsvp/by-token/{token}` read RSVP status by invitation token
- `GET /photos` list approved album photos
- `POST /photos/upload-intent` get presigned guest upload target
- `POST /photos/complete-upload` persist uploaded photo metadata
- `GET /contacts` list public logistics contacts
- `GET /admin/guests` list all guests with RSVP status (requires admin bearer token)
- `GET /admin/rsvp-stats` aggregated RSVP statistics (requires admin bearer token)
- `GET /admin/photos` list all uploaded photos for moderation (requires admin bearer token)
- `PATCH /admin/photos/{photo_id}` update moderation status (requires admin bearer token)
- `GET /admin/contacts` list all logistics contacts (requires admin bearer token)
- `POST /admin/contacts` create logistics contact (requires admin bearer token)
- `PATCH /admin/contacts/{contact_id}` update logistics contact (requires admin bearer token)
- `DELETE /admin/contacts/{contact_id}` delete logistics contact (requires admin bearer token)

## Backend tests

Run tests from `backend/`:

```bash
./venv/bin/pytest
```

Current coverage includes:
- registration, login, refresh token rotation and profile reads/updates
- invite creation + guest lookup flow
- RSVP lookup before and after confirmation
- admin guest list with and without RSVP

## Frontend quick start (Expo)

1. Backend must be running (`uvicorn` on port 8000).

2. From `frontend/`:

```bash
cp env.example .env
npm install
npm run web
```

3. Open the app in the browser. Guest RSVP flow: `/rsvp/{invitation_token}`  
   Create a real token via Swagger `POST /guest/create-invite` while logged in as an admin user, then open  
   `http://localhost:8081/rsvp/YOUR_TOKEN` (port may vary; check terminal output).

On a physical phone, set `EXPO_PUBLIC_API_URL` to your computer LAN IP (not `127.0.0.1`).

## Frontend tests plan

Recommended sequence:

1. Widget tests for RSVP form components
2. Integration test for token → confirm flow
3. E2E on web only when flows stabilize
