---
name: aot-testing
description: >-
  Scrive, aggiorna e verifica test backend (pytest) e frontend (Vitest) per AOT
  Wedding App. Usa quando l'utente chiede test, copertura, fixture, regressione,
  o quando una feature è completa solo con suite verde. Delega a @aot-backend-test
  o @aot-frontend-test per l'implementazione.
---

# AOT Testing — skill workflow

Policy sempre attiva: `.cursor/rules/02-testing.mdc`.

## Agenti e comandi

| Stack | Agente | Comando |
|-------|--------|---------|
| Backend API | `@aot-backend-test` | `cd backend && ./venv/bin/pytest -q` |
| Frontend unit | `@aot-frontend-test` | `cd frontend && npm test` |
| Frontend E2E | `@aot-frontend-e2e` | `./scripts/run-e2e.sh` |
| Review | `@aot-test-reviewer` | prima del merge |

## Quando delegare

| Modifica | Agente |
|----------|--------|
| Route/service BE | `@aot-backend-test` |
| Funzione/hook/service FE | `@aot-frontend-test` |
| Pagine/route/flussi UI | `@aot-frontend-e2e` |
| Feature BE end-to-end | `@aot-backend-feature` (step test incluso) |
| UI con logica | `@obw-ui` → `@aot-frontend-test` + E2E se route |

## Cosa testare (minimo)

| Tipo | Obbligatorio |
|------|--------------|
| Route API | happy path, 422/400, 401/403 se protetta |
| Logica pura / hook | input → output, edge case |
| Componente con stato | logica estratta o interazione significativa |

## Cosa evitare

- Mount senza assert sul comportamento
- HTTP reali o DB produzione (FE)
- Mock SQLAlchemy (BE) — usa `conftest.py`
- Nuovi test in `src/__tests__/`

---

## Backend (pytest)

### File e naming

- `backend/tests/test_<dominio>_api.py`
- `test_<azione>_<esito>`

### Fixture (`conftest.py`)

`api_client` · `user_headers` · `admin_headers` — DB `aot_wedding_app_test`, non mockare.

### Checklist endpoint

| Scenario | Status |
|----------|--------|
| Happy path | 200/201 + body |
| Validazione | 422 |
| Errore dominio | 400/409 + `detail` |
| Senza token | 401 |
| Non admin | 403 |

Nuova tabella → aggiungi a `truncate_test_tables`.

Esempi: `test_rsvp_api.py`, `test_auth_api.py`, `test_admin_auth_api.py`

---

## Frontend (Vitest)

### Percorsi

`__tests__/` co-locato al modulo (`components/`, `cinematic/`, `services/`, ecc.).

### Priorità

1. Funzioni pure · 2. Service HTTP · 3. Hook/context · 4. Render solo se inevitabile

### Mock

`vi.restoreAllMocks()` in `afterEach` · mock `services/*` · `vi.stubGlobal` per API browser.

Esempi: `getUserInitials.test.ts`, `apiErrors.test.ts`, `copyToClipboard.test.ts`

---

## Frontend E2E (Playwright)

### Percorsi

`frontend/e2e/*.spec.ts` — richiede stack locale (backend + frontend).

### Comandi

```bash
./scripts/run-e2e.sh
cd frontend && PLAYWRIGHT_REUSE_SERVER=1 npm run test:e2e
```

### Smoke inclusi

- Health API · home · album pubblico · login form
- Auth guard su `/profile`, `/rsvp`, `/travel`, `/admin`
- Pagina 404

Agente: `@aot-frontend-e2e`

---

## Workflow

1. Scenari mancanti dai file modificati
2. Test co-locati
3. Esegui suite layer
4. Itera fino a verde
5. Riassumi: file, scenari, comando, esito
