# Backend — AOT Wedding API

FastAPI + SQLAlchemy + PostgreSQL. Nessun framework ORM "magico": routes chiamano
services, services usano SQLAlchemy Session direttamente sui models.

## Stack

- **FastAPI** (`main.py`) — app, CORS, un unico exception handler per `AuthConfigError`
- **SQLAlchemy 2.x** — ORM, `database/base.py`
- **Alembic** — migrazioni (`alembic/versions/`)
- **PostgreSQL** via `psycopg` — driver
- **PyJWT** — access/refresh token
- **boto3** — upload foto su S3 (presigned URL, nessun file passa dal backend)
- **pytest** — test in `tests/`, DB di test separato (`TEST_DATABASE_URL`)

## Layout

```
routes/     endpoint HTTP — solo parsing richiesta, chiamata al service, mapping errori → HTTP status
services/   logica di business, query SQLAlchemy
schemas/    Pydantic — validazione input/output, mai usati come models DB
models/     SQLAlchemy ORM — mappano le tabelle
constants/  valori condivisi (codici errore, limiti)
database/   connessione, bootstrap Alembic, creazione DB di dev/test
```

Un modulo per ogni feature (es. `rsvp_confirmation_route.py` → `rsvp_service.py` →
`rsvp_model.py`), non layer condivisi giganti.

## Endpoint

| Metodo | Path | Auth | Cosa fa |
| --- | --- | --- | --- |
| GET | `/health` | — | liveness check |
| POST | `/auth/register` | — | crea utente + sessione |
| POST | `/auth/login` | — | email+password → sessione |
| POST | `/auth/refresh` | refresh cookie | rinnova access token |
| GET | `/auth/me` | access token | profilo utente corrente |
| PATCH | `/auth/me` | access token | aggiorna profilo |
| POST | `/auth/logout` | refresh cookie | invalida sessione |
| GET | `/rsvp/me` | access token | stato RSVP dell'utente |
| POST | `/rsvp/confirm` | access token | crea RSVP (una volta sola) |
| PATCH | `/rsvp/me` | access token | modifica RSVP (entro `RSVP_EDIT_DEADLINE`) |
| GET | `/admin/users` | ruolo admin | lista utenti + stato RSVP |
| GET | `/admin/rsvp-stats` | ruolo admin | conteggi aggregati RSVP |
| GET | `/contacts` | — | contatti logistici pubblici |
| GET/POST/PATCH/DELETE | `/admin/contacts` | ruolo admin | CRUD contatti logistici |
| GET | `/photos` | — | elenco foto approvate |
| POST | `/photos/upload-intent` | access token | presigned URL S3 |
| POST | `/photos/complete-upload` | access token | registra la foto dopo l'upload |

Il ruolo `admin` non è un flag nel DB: `read_wedding_role_secret()` verifica un
secret condiviso passato in fase di registrazione (vedi `auth_service.py`).

## Modello dati

`users` → `rsvps` (1:1) → `rsvp_guests` (1:N, max 10, vedi `constants/rsvp_party.py`)
`users` → `refresh_token_sessions` (1:N)
`photo_album_items`, `logistics_contacts` — tabelle indipendenti, riferiscono `users` solo per l'autore.

La fazione (`scout_regiment` / `garrison` / `military_police`) viene assegnata
automaticamente e bilanciata tra i tre gruppi (`rsvp_faction_service.py`), non è
scelta dall'utente.

## Variabili d'ambiente

Vedi `env.example`. Le principali:

- `DATABASE_URL` / `TEST_DATABASE_URL` — Postgres, dev e test separati
- `JWT_SECRET_KEY` — obbligatoria, altrimenti ogni endpoint auth risponde 503
- `WEDDING_ROLE_SECRET` — secret per registrarsi come admin
- `CORS_ALLOW_ORIGINS` — vuoto = tutte le origini (dev)
- `S3_*` — bucket foto (presigned upload)
- `RSVP_EDIT_DEADLINE` — dopo questa data l'RSVP non è più modificabile

## Sviluppo

```bash
./scripts/run-backend.sh   # crea venv, avvia Postgres via Docker, migra, serve su :8000
```

Test:

```bash
source venv/bin/activate
pytest
```
