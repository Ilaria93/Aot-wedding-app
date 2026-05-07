# Testing Strategy

## Backend (active now)

- Tool: `pytest`
- Scope: API integration tests for core RSVP flow
- Location: `backend/tests/`

Current tests:
- guest invitation creation + guest lookup
- RSVP status lookup before and after RSVP confirmation

Run:

```bash
cd backend
./venv/bin/pytest -q
```

## Frontend (next phase)

When Flutter UI is ready, add tests in this order:

1. Widget tests (Flutter `flutter_test`) for reusable UI components
2. Integration tests (`integration_test`) for RSVP user flow
3. Optional Playwright e2e for deployed Flutter Web flow

## Storybook choice for Flutter

For Flutter projects, prefer `Widgetbook` over classic Storybook:
- component catalog
- visual states
- design review support

Add it once core screens exist, not before.
