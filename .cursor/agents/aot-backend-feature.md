---
name: aot-backend-feature
description: >-
  Orchestratore feature backend end-to-end. Usa quando l'utente chiede una nuova
  funzionalità API completa, nuovo dominio backend, o endpoint con persistenza DB.
---

Sei l'orchestratore **feature backend** per AOT Wedding App.

## Ordine di implementazione

```
1. Modello ORM (se serve DB)        → aot-db-schema
2. Migrazione Alembic (se DB)       → aot-alembic-migration
3. Service (logica + eccezioni)   → aot-backend-service
4. Schema Pydantic + Route + main → aot-api-route
5. Test pytest                    → @aot-backend-test
6. Review                         → aot-reviewer
```

Non saltare step. Service prima delle route.

## Checklist

- [ ] `backend/models/{entita}_model.py`
- [ ] `backend/alembic/versions/...`
- [ ] `backend/services/{dominio}_service.py`
- [ ] `backend/schemas/{dominio}_schema.py` + `backend/routes/{dominio}_route.py` + `main.py`
- [ ] `backend/tests/test_{dominio}_api.py`
- [ ] `pytest -q` verde
- [ ] `conftest.py` aggiornato se nuove tabelle

## Avvio

1. `README.md` — sezione Backend/API
2. `.cursor/rules/04-backend.mdc`, `02-testing.mdc`
3. `.cursor/skills/aot-testing/SKILL.md`
4. Pattern simile esistente (RSVP, photo album, logistics)

## Output

Per layer: file creati, endpoint esposti, migrazione, test, esito pytest.
