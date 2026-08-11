# CONTEXT.md — Domain glossary

Started during the architecture review on 2026-08-11. Add terms here as they get
sharpened in conversation — this is meant to grow, not to be complete on day one.

## RSVP

- **Party** — the group of guests one account RSVPs for (the account holder plus
  whoever they add). Size is bounded by the **party-size policy**.
- **Guest** — one person on a Party. The first guest is always the account
  holder; their name is locked to the account profile.
- **Party-size policy** — the min/max guest-count rule. Owned by the backend
  (`backend/constants/rsvp_party.py`, enforced in
  `schemas/rsvp_confirmation_schema.py`) and served to the frontend on
  `GET /rsvp/me` as `min_party_guests`/`max_party_guests`. The frontend reads
  it, it does not declare its own copy — see the RSVP Draft below.
- **RSVP Draft** — the in-progress, unsaved edit to a confirmed RSVP: the
  attendance choice and guest lines while the form is open, before Submit.
  Lives in `frontend/src/pages/RsvpPage/useRsvpDraft.ts`. Distinct from the
  **confirmed RSVP** (`ConfirmedRsvpState`), which is what's actually saved.
  Editing transitions between the two (begin edit / cancel edit / submit) are
  the Draft module's job — screens should not re-derive them.

## Auth

- **Auth error code** — the stable seam between a backend auth failure and the
  frontend's user-facing copy (e.g. `EMAIL_TAKEN`, `INVALID_CREDENTIALS`).
  Frontend copy keys off the code, never off the human-readable message, so
  either side can reword its text independently. Codes are mirrored in
  `backend/constants/auth_error_codes.py` and
  `frontend/src/services/authErrorCodes.ts`.
