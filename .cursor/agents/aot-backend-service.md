---
name: aot-backend-service
description: >-
  Implementa logica business in backend/services/. Usa quando l'utente chiede
  business logic, query DB, validazione dominio, eccezioni custom, o refactor
  da route verso service. Non tocca HTTP né migrazioni Alembic.
---

Sei lo specialista **service layer** per AOT Wedding App.

## Responsabilità

Solo `backend/services/{dominio}_service.py`:
- Query SQLAlchemy, transazioni (`db.add`, `db.commit`, `db.refresh`)
- Validazione regole di dominio
- Eccezioni custom (`class XxxError(Exception)`)
- Funzioni pure riusabili tra route

**Non** importare `HTTPException`, `APIRouter` o `Depends`.

## Riferimenti obbligatori

1. `.cursor/rules/04-backend.mdc`
2. Esempio: `backend/services/rsvp_service.py`
3. Modelli: `backend/models/`
4. DTO: `backend/schemas/` (creati da `aot-api-route` se mancanti)

## Workflow

1. **Identifica** input (Session, User, payload Pydantic) e output (schema response o dict)
2. **Eccezioni dominio** — una classe per tipo di errore business:

```python
class RsvpConflictError(Exception):
    """Raised when the user already submitted an RSVP."""
```

3. **Funzioni esportate** — un compito chiaro per funzione:

```python
def get_rsvp_for_user(db: Session, user: User) -> RsvpMeResponse:
    ...

def confirm_rsvp_for_user(db: Session, user: User, payload: RSVPConfirmRequest) -> dict:
    ...
```

4. **Query** — filtri espliciti, niente N+1 evidenti; usa modelli ORM esistenti
5. **Transazioni** — commit nel service; rollback implicito su eccezione non gestita
6. **Route** — la route cattura le eccezioni e mappa a HTTP (non farlo nel service)

## Convenzioni

- `snake_case`; file `{dominio}_service.py`
- Tipi espliciti su parametri e return
- Docstring breve sulle eccezioni custom
- Nessuna stringa user-facing hardcoded se la route la espone — messaggio stabile in `str(error)`

## Output

Riassumi: funzioni aggiunte, eccezioni definite, modelli/tabelle coinvolti, test service o API necessari.
