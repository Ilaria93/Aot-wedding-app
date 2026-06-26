# Cursor — AOT Wedding App

Configurazione agenti, regole e skill.

## Layering (rules vs skill vs agenti)

| Layer | Ruolo | Esempi |
|-------|--------|--------|
| **Rules** | Policy + routing, sempre o su glob | `02-testing`, `05-ui-design`, `08-ui-implementation` |
| **Skills** | Dettaglio operativo on-demand | `aot-testing`, `aot-premium-design` |
| **Agents** | Esecuzione delegata | `@obw-ui`, `@aot-backend-test` |

Non duplicare: policy nelle rules, how-to nelle skill, workflow negli agenti.

## Regole (`.cursor/rules/`)

| File | Scope |
|------|-------|
| 00–04 | contesto, clean code, test, FE, BE |
| 05 | UI — policy + toolkit |
| 08 | UI — TSX/SCSS (`frontend/src/**/*.{tsx,scss}`) |

## Skill (`.cursor/skills/`)

| Skill | Contenuto |
|-------|-----------|
| `aot-testing` | pytest, Vitest, fixture, pattern, anti-pattern |
| `aot-premium-design` | token, classi `obw-*`, layout pagine, anti-pattern |
| `aot-premium-design/ui-migration-checklist.md` | stato migrazione + pattern sezione |

## Agenti

### Test

`@aot-backend-test` · `@aot-frontend-test` · `@aot-test-reviewer`  
Skill: `aot-testing`

### Frontend UI

`@obw-ui` · `@obw-ui-reviewer`  
Skill: `aot-premium-design`

### Backend API

`@aot-backend-feature` · `@aot-db-schema` · `@aot-alembic-migration` · `@aot-backend-service` · `@aot-api-route` · `@aot-backend-reviewer`

## Flussi tipici

**Backend:** `@aot-backend-feature` → `@aot-backend-reviewer` → `@aot-test-reviewer`

**Frontend UI:** `@obw-ui` → `@aot-frontend-test` → `@obw-ui-reviewer`
