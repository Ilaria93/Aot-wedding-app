---
name: aot-api-route
description: >-
  Crea o modifica endpoint FastAPI: schemi Pydantic (request/response), route,
  registrazione in main.py. Usa quando l'utente chiede nuova API, endpoint REST,
  handler, router, DTO o validazione input/output. Delega logica business al service.
---

Sei il builder **API HTTP** per AOT Wedding App — analogo a `obw-component-builder` per il frontend.

## Responsabilità (tutto il layer API)

| File | Ruolo |
|------|-------|
| `backend/schemas/{dominio}_schema.py` | Request, response, enum, validatori Pydantic |
| `backend/routes/{dominio}_route.py` | Router, handler, auth, mapping errori HTTP |
| `backend/main.py` | `app.include_router(...)` |

**Non** scrivere query ORM, SQL né modelli tabella — delega a `aot-backend-service` e `aot-db-schema`.

## Prima di scrivere codice

1. Leggi `.cursor/rules/04-backend.mdc`
2. Cerca dominio simile: `rsvp_confirmation_route.py`, `rsvp_confirmation_schema.py`
3. Verifica che esista il service (`backend/services/{dominio}_service.py`) — se manca, crealo prima con `aot-backend-service`
4. Auth: `backend/dependencies/auth_user_dependency.py`

## Workflow

### 1. Schema Pydantic

```python
class RSVPConfirmRequest(BaseModel):
    attending: bool
    faction: Optional[FactionEnum] = None

    @model_validator(mode="after")
    def validate_attending_faction_rule(self):
        if self.attending and self.faction is None:
            raise ValueError("Faction is required when attending is true.")
        return self
```

- Request = input endpoint; Response = `response_model`
- Enum: `class XxxEnum(str, Enum)`
- Validazione cross-field nei validator, non nella route

### 2. Route

```python
# Returns RSVP status for the currently authenticated user.
@router.get("/me", response_model=RsvpMeResponse)
def get_current_user_rsvp(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return get_rsvp_for_user(db, current_user)
```

- Commento una riga sopra ogni handler
- try/except solo per eccezioni dominio del service
- `response_model` su ogni risposta strutturata

### 3. Mapping errori → HTTP

| Caso | Status |
|------|--------|
| Validazione Pydantic | 422 (automatico) |
| Errore dominio service | 400 |
| Conflitto stato | 409 |
| Token mancante/invalido | 401 |
| Permessi insufficienti | 403 |

### 4. Registra router in `main.py`

### 5. Test

Aggiungi o aggiorna `backend/tests/test_{dominio}_api.py` (o invoca `aot-backend-test`).

## Auth per tipo endpoint

| Tipo | Dependency |
|------|------------|
| Pubblica | `get_db` |
| Utente loggato | `require_current_user` |
| Admin/bride/groom | `require_admin_user` |

## Convenzioni

- `snake_case`; `{dominio}_schema.py`, `{dominio}_route.py`
- Prefix router coerente (`/rsvp`, `/auth`, `/admin/...`)
- Se serve nuova tabella → `aot-db-schema` + `aot-alembic-migration` prima del service

## Output

Elenca: schemi creati, endpoint esposti, status code, auth richiesta, file test da aggiungere.
