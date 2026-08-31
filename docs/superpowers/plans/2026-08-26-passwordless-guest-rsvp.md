# Passwordless Guest RSVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a wedding guest confirm/edit their RSVP using only their personalized WhatsApp invite link (`/invito/{token}`) plus an email-based magic link for returning later — no password, no public registration. The couple/admin accounts are untouched.

**Architecture:** The invite token remains the sole access control (already built). A new public endpoint accepts the RSVP payload plus an email, transparently creates a passwordless `User` (`password_hash IS NULL`) tied to that invite, and reuses the existing RSVP service/session machinery unchanged. A `guest_magic_links` table backs a mono-use, 24h email link for returning without the original WhatsApp message.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic (backend), React + Vite + React Router (frontend), Resend (transactional email) called via `httpx` (already a dependency — no new package).

**Spec:** `docs/superpowers/specs/2026-08-26-passwordless-guest-rsvp-design.md`

## Global Constraints

- No new backend dependency for email — use `httpx` (already in `requirements.txt`).
- `RSVP`/`RsvpGuest` models and `confirm_rsvp_for_user`/`update_rsvp_for_user`/`get_rsvp_for_user` in `backend/services/rsvp_service.py` are **unchanged** — the guest path only changes how a `User` is obtained, never the RSVP logic itself.
- Guest users get `role="user"` (same as today's real accounts) — no new role value. `password_hash IS NULL` is the only marker of a passwordless account.
- Magic links: 24h expiry (`GUEST_MAGIC_LINK_EXPIRES_MINUTES=1440` default), mono-use, requesting a new one invalidates prior unused ones for that user.
- Out of scope (do not build): admin UI for invite list/sending, 2FA for the couple's account, pre-filling reserved party size from the invite.

---

## Task 0: Create the integration branch

This repo currently has the target work split across branches: `main` (has the RSVP party model, no invite links), `feature/inviti` (has `invite_links` table + `/invito/{token}` frontend, branched from the same point as `main`), and `feature/landing-polish` (current branch, off `main`, unrelated landing-page work). This plan needs both the RSVP model (on `main`) and `invite_links` (on `feature/inviti`).

**Files:** none (git operations only)

- [ ] **Step 1: Create a new branch from `main` and merge `feature/inviti` into it**

```bash
cd /Users/misa/projects/personali/aot-wedding/Aot-wedding-app
git status --short                      # confirm no uncommitted work is lost
git checkout main
git pull origin main
git checkout -b feature/passwordless-guest-rsvp
git merge feature/inviti
```

Expected: a clean, no-conflict merge (the two branches only diverge by `feature/inviti` adding `invite_links` on top of the same point `main` is at — verified during design). If a conflict appears in `backend/alembic/env.py` or `backend/main.py`, resolve by keeping **both** sides' additions (both branches only ever add lines to these files, never edit the same line).

- [ ] **Step 2: Verify the merged tree builds and existing tests pass**

```bash
cd backend
docker compose -f ../docker-compose.yml up -d postgres 2>/dev/null || docker compose up -d postgres
./venv/bin/alembic -c alembic.ini upgrade head
./venv/bin/pytest -q
cd ../frontend
npm install
npx tsc --noEmit
npm test -- run
```

Expected: alembic upgrades cleanly to `20260818_0004` (the invite_links migration), all backend and frontend tests pass, no type errors.

- [ ] **Step 3: Commit the merge**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: merge feature/inviti into passwordless-guest-rsvp base

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

(If the merge produced no changes to commit because it fast-forwarded, skip this step.)

---

## Task 1: Data model — nullable password, invite→user link, magic links table

**Files:**
- Modify: `backend/models/user_model.py`
- Modify: `backend/models/invite_link_model.py`
- Create: `backend/models/guest_magic_link_model.py`
- Modify: `backend/alembic/env.py:8-15` (model import list)
- Create: `backend/alembic/versions/20260826_0005_guest_passwordless_access.py`
- Modify: `backend/tests/conftest.py` (truncate list)
- Test: `backend/tests/test_alembic_bootstrap.py` (existing test already exercises a full upgrade; no new test file needed for this task — verified via Step 4 below)

**Interfaces:**
- Produces: `User.password_hash` is now `Optional[str]`; `InviteLink.user_id: Optional[int]`; `GuestMagicLink(id, user_id, email, token_hash, expires_at, used_at, created_at)`.

- [ ] **Step 1: Modify `backend/models/user_model.py`**

Change:
```python
    password_hash = Column(String(255), nullable=False)
```
to:
```python
    # Nullable: guest accounts created via the WhatsApp invite flow never set
    # one (see services/guest_access_service.py). NULL means "passwordless
    # guest account", not "broken record".
    password_hash = Column(String(255), nullable=True)
```

- [ ] **Step 2: Modify `backend/models/invite_link_model.py`**

Add the import and the new column/relationship:
```python
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.base import Base


class InviteLink(Base):
    __tablename__ = "invite_links"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    created_at = Column(DateTime, nullable=False)
    # Set the first time this invite's guest confirms/recovers access — lets
    # a repeat visit reuse the same guest User instead of creating another.
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True, index=True)

    user = relationship("User")
```

- [ ] **Step 3: Create `backend/models/guest_magic_link_model.py`**

```python
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.base import Base


# One row per magic-link email sent to a guest to return to/edit their RSVP
# without a password. Mono-use: `used_at` is set the moment it's redeemed.
class GuestMagicLink(Base):
    __tablename__ = "guest_magic_links"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(160), nullable=False)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False)

    user = relationship("User")
```

- [ ] **Step 4: Register the new model with Alembic**

In `backend/alembic/env.py`, the import block currently reads:
```python
from models import (  # noqa: F401
    logistics_contact_model,
    photo_album_item_model,
    refresh_token_session_model,
    rsvp_guest_model,
    rsvp_model,
    user_model,
)
```
After the Task 0 merge it will also include `invite_link_model` (brought in by `feature/inviti`). Add `guest_magic_link_model` so the final block reads (alphabetical order, matching the existing style):
```python
from models import (  # noqa: F401
    guest_magic_link_model,
    invite_link_model,
    logistics_contact_model,
    photo_album_item_model,
    refresh_token_session_model,
    rsvp_guest_model,
    rsvp_model,
    user_model,
)
```

- [ ] **Step 5: Create the migration `backend/alembic/versions/20260826_0005_guest_passwordless_access.py`**

```python
"""Passwordless guest RSVP access: nullable password, invite-to-user link, magic links.

Revision ID: 20260826_0005
Revises: 20260818_0004
Create Date: 2026-08-26 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260826_0005"
down_revision: Union[str, Sequence[str], None] = "20260818_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)

    op.add_column("invite_links", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_unique_constraint("uq_invite_links_user_id", "invite_links", ["user_id"])
    op.create_foreign_key(
        "fk_invite_links_user_id",
        "invite_links",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_table(
        "guest_magic_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_guest_magic_links_user_id", "guest_magic_links", ["user_id"], unique=False)
    op.create_index(
        "ix_guest_magic_links_token_hash", "guest_magic_links", ["token_hash"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_guest_magic_links_token_hash", table_name="guest_magic_links")
    op.drop_index("ix_guest_magic_links_user_id", table_name="guest_magic_links")
    op.drop_table("guest_magic_links")

    op.drop_constraint("fk_invite_links_user_id", "invite_links", type_="foreignkey")
    op.drop_constraint("uq_invite_links_user_id", "invite_links", type_="unique")
    op.drop_column("invite_links", "user_id")

    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
```

- [ ] **Step 6: Add the two new tables to the test-DB truncate list**

In `backend/tests/conftest.py`, the `truncate_test_tables()` function has a `TRUNCATE TABLE` statement listing tables. Add `guest_magic_links` and `invite_links` (the latter was missed when `feature/inviti` was built and has no test coverage yet — add it now so guest-flow tests get a clean slate every test):

```python
def truncate_test_tables():
    """Clears application data while keeping the migrated schema intact."""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                TRUNCATE TABLE
                    guest_magic_links,
                    invite_links,
                    refresh_token_sessions,
                    photo_album_items,
                    rsvp_guests,
                    rsvps,
                    logistics_contacts,
                    users
                RESTART IDENTITY CASCADE
                """
            )
        )
```

- [ ] **Step 7: Run the migration and existing test suite to confirm nothing broke**

```bash
cd backend
./venv/bin/alembic -c alembic.ini upgrade head
./venv/bin/pytest -q
```

Expected: migration applies cleanly (now at `20260826_0005`), all existing tests still pass — this task only adds nullability/columns/tables, no existing behavior changes.

- [ ] **Step 8: Commit**

```bash
git add backend/models/user_model.py backend/models/invite_link_model.py \
  backend/models/guest_magic_link_model.py backend/alembic/env.py \
  backend/alembic/versions/20260826_0005_guest_passwordless_access.py \
  backend/tests/conftest.py
git commit -m "$(cat <<'EOF'
feat(be): data model for passwordless guest RSVP access

users.password_hash becomes nullable, invite_links gains an optional
link to the guest User it created, and a new guest_magic_links table
backs the email return/recovery flow.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Settings + email sending

**Files:**
- Modify: `backend/settings.py`
- Create: `backend/services/email_service.py`
- Modify: `backend/env.example`
- Test: `backend/tests/test_email_service.py`

**Interfaces:**
- Produces: `send_email(to: str, subject: str, html_body: str) -> None`, raises `EmailSendError`. Settings readers: `read_resend_api_key()`, `read_email_from_address()`, `read_frontend_base_url()`, `read_guest_magic_link_expires_minutes()`.

- [ ] **Step 1: Add settings readers to `backend/settings.py`**

Add near the other `read_*` functions (matching the existing style — see `read_wedding_role_secret` just above):

```python
def read_resend_api_key() -> str:
    return os.getenv("RESEND_API_KEY", "").strip()


def read_email_from_address() -> str:
    return os.getenv("EMAIL_FROM_ADDRESS", "onboarding@resend.dev").strip()


def read_frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").strip().rstrip("/")


def read_guest_magic_link_expires_minutes() -> int:
    raw_value = os.getenv("GUEST_MAGIC_LINK_EXPIRES_MINUTES", "1440").strip()
    try:
        return int(raw_value)
    except ValueError:
        return 1440
```

- [ ] **Step 2: Write the failing test for the email service**

Create `backend/tests/test_email_service.py`:
```python
from __future__ import annotations

import os

import httpx
import pytest

from services.email_service import EmailSendError, send_email


def test_send_email_raises_without_api_key(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    with pytest.raises(EmailSendError, match="RESEND_API_KEY"):
        send_email(to="guest@example.com", subject="Hi", html_body="<p>Hi</p>")


def test_send_email_posts_to_resend(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "test-resend-key")
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "wedding@example.com")

    captured = {}

    def fake_post(url, headers=None, json=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return httpx.Response(200, json={"id": "abc"}, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)

    send_email(to="guest@example.com", subject="Hi", html_body="<p>Hi</p>")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"]["Authorization"] == "Bearer test-resend-key"
    assert captured["json"]["from"] == "wedding@example.com"
    assert captured["json"]["to"] == ["guest@example.com"]


def test_send_email_raises_on_provider_error(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "test-resend-key")

    def fake_post(url, headers=None, json=None, timeout=None):
        return httpx.Response(422, json={"message": "invalid"}, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)

    with pytest.raises(EmailSendError, match="422"):
        send_email(to="guest@example.com", subject="Hi", html_body="<p>Hi</p>")
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd backend
./venv/bin/pytest tests/test_email_service.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'services.email_service'`.

- [ ] **Step 3: Implement `backend/services/email_service.py`**

```python
import httpx

from settings import read_email_from_address, read_resend_api_key

RESEND_API_URL = "https://api.resend.com/emails"


class EmailSendError(Exception):
    """Raised when the transactional email provider rejects or fails a send."""


def send_email(to: str, subject: str, html_body: str) -> None:
    api_key = read_resend_api_key()
    if not api_key:
        raise EmailSendError("RESEND_API_KEY is not configured on this server.")

    response = httpx.post(
        RESEND_API_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "from": read_email_from_address(),
            "to": [to],
            "subject": subject,
            "html": html_body,
        },
        timeout=10.0,
    )
    if response.status_code >= 400:
        raise EmailSendError(f"Resend API error {response.status_code}: {response.text}")
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd backend
./venv/bin/pytest tests/test_email_service.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Document the new env vars in `backend/env.example`**

Append a new section (after the existing "Photo album / S3" block):
```
# -----------------------------------------------------------------------------
# Transactional email (Resend) — required for the guest magic-link flow
# -----------------------------------------------------------------------------
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=onboarding@resend.dev
# Public URL of the deployed frontend — used to build the magic-link email URL.
FRONTEND_BASE_URL=http://localhost:5173
GUEST_MAGIC_LINK_EXPIRES_MINUTES=1440
```

- [ ] **Step 6: Commit**

```bash
git add backend/settings.py backend/services/email_service.py \
  backend/env.example backend/tests/test_email_service.py
git commit -m "$(cat <<'EOF'
feat(be): Resend-backed email sending service

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Guest access service (identity + magic links)

**Files:**
- Create: `backend/schemas/guest_access_schema.py`
- Create: `backend/services/guest_access_service.py`
- Test: `backend/tests/test_guest_access_service.py`

**Interfaces:**
- Consumes: `InviteLink` (Task 0 merge), `User` (Task 1), `GuestMagicLink` (Task 1), `send_email` (Task 2), `confirm_rsvp_for_user`/`update_rsvp_for_user` from `services.rsvp_service` (existing, unchanged), `issue_auth_session` from `services.auth_token_service` (existing, unchanged).
- Produces: `GuestInviteNotFoundError`, `GuestMagicLinkInvalidError`; `get_or_create_guest_user(db, invite_link, email) -> User`; `confirm_guest_rsvp(db, token, payload) -> tuple[AuthSessionResponse, RsvpSubmitResponse]`; `request_guest_magic_link(db, email) -> None`; `verify_guest_magic_link(db, raw_token) -> AuthSessionResponse`.

- [ ] **Step 1: Create `backend/schemas/guest_access_schema.py`**

```python
from pydantic import BaseModel, EmailStr

from schemas.auth_schema import AuthSessionResponse
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse


class GuestRsvpConfirmRequest(RSVPSubmitRequest):
    email: EmailStr


class GuestRsvpConfirmResponse(BaseModel):
    session: AuthSessionResponse
    rsvp: RsvpSubmitResponse


class GuestMagicLinkRequest(BaseModel):
    email: EmailStr


class GuestMagicLinkRequestResponse(BaseModel):
    ok: bool = True
```

- [ ] **Step 2: Write the failing tests**

Create `backend/tests/test_guest_access_service.py`:
```python
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.user_model import User
from schemas.guest_access_schema import GuestRsvpConfirmRequest
from services.guest_access_service import (
    GuestInviteNotFoundError,
    GuestMagicLinkInvalidError,
    confirm_guest_rsvp,
    get_or_create_guest_user,
    request_guest_magic_link,
    verify_guest_magic_link,
)


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def invite_link(db_session):
    invite = InviteLink(
        token="test-token-123",
        first_name="Mario",
        last_name="Rossi",
        created_at=datetime.utcnow(),
    )
    db_session.add(invite)
    db_session.commit()
    db_session.refresh(invite)
    return invite


def _guest_payload(email: str = "mario@example.com"):
    return GuestRsvpConfirmRequest(
        email=email,
        attending=True,
        guests=[
            {
                "first_name": "Mario",
                "last_name": "Rossi",
                "meal_choice": "standard",
                "intolerance": "none",
            }
        ],
    )


def test_get_or_create_guest_user_creates_passwordless_user(db_session, invite_link):
    user = get_or_create_guest_user(db_session, invite_link, "mario@example.com")
    assert user.password_hash is None
    assert user.email == "mario@example.com"
    assert user.role == "user"


def test_get_or_create_guest_user_reuses_same_user_on_repeat_visit(db_session, invite_link):
    first = get_or_create_guest_user(db_session, invite_link, "mario@example.com")
    db_session.refresh(invite_link)
    second = get_or_create_guest_user(db_session, invite_link, "mario@example.com")
    assert first.id == second.id


def test_confirm_guest_rsvp_unknown_token_raises(db_session):
    with pytest.raises(GuestInviteNotFoundError):
        confirm_guest_rsvp(db_session, "no-such-token", _guest_payload())


def test_confirm_guest_rsvp_returns_session_and_rsvp(db_session, invite_link):
    session, rsvp = confirm_guest_rsvp(db_session, invite_link.token, _guest_payload())
    assert session.access_token
    assert session.user.email == "mario@example.com"
    assert rsvp.ok is True
    assert rsvp.guest_count == 1


def test_confirm_guest_rsvp_twice_updates_instead_of_conflicting(db_session, invite_link):
    confirm_guest_rsvp(db_session, invite_link.token, _guest_payload())
    db_session.refresh(invite_link)
    _, second_rsvp = confirm_guest_rsvp(
        db_session,
        invite_link.token,
        _guest_payload(),
    )
    assert second_rsvp.ok is True


def test_verify_guest_magic_link_rejects_unknown_token(db_session):
    with pytest.raises(GuestMagicLinkInvalidError):
        verify_guest_magic_link(db_session, "not-a-real-token")


def test_request_guest_magic_link_is_silent_for_unknown_email(db_session):
    # Must not raise — uniform response whether or not the email matches a guest.
    request_guest_magic_link(db_session, "nobody@example.com")
```

- [ ] **Step 3: Run to verify failure**

```bash
cd backend
./venv/bin/pytest tests/test_guest_access_service.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'services.guest_access_service'`.

- [ ] **Step 4: Implement `backend/services/guest_access_service.py`**

```python
from datetime import datetime, timedelta
import hashlib
import secrets

from sqlalchemy.orm import Session

from models.guest_magic_link_model import GuestMagicLink
from models.invite_link_model import InviteLink
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.auth_schema import AuthSessionResponse
from schemas.guest_access_schema import GuestRsvpConfirmRequest
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse
from services.auth_credentials_service import normalize_email
from services.auth_token_service import issue_auth_session
from services.email_service import send_email
from services.rsvp_service import confirm_rsvp_for_user, update_rsvp_for_user
from settings import read_frontend_base_url, read_guest_magic_link_expires_minutes


class GuestInviteNotFoundError(Exception):
    """Raised when the invite token does not match any invite_links row."""


class GuestMagicLinkInvalidError(Exception):
    """Raised when a magic link token is unknown, expired, or already used."""


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def get_or_create_guest_user(db: Session, invite_link: InviteLink, email: str) -> User:
    if invite_link.user_id:
        existing_linked_user = db.query(User).filter(User.id == invite_link.user_id).first()
        if existing_linked_user:
            return existing_linked_user

    normalized_email = normalize_email(email)
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        user = User(
            first_name=invite_link.first_name,
            last_name=invite_link.last_name,
            email=normalized_email,
            password_hash=None,
            role="user",
            created_at=datetime.utcnow(),
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()

    invite_link.user_id = user.id
    db.commit()
    db.refresh(user)
    return user


def _issue_and_send_magic_link(db: Session, user: User, email: str) -> None:
    db.query(GuestMagicLink).filter(
        GuestMagicLink.user_id == user.id,
        GuestMagicLink.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})

    raw_token = secrets.token_urlsafe(32)
    expires_minutes = read_guest_magic_link_expires_minutes()
    magic_link = GuestMagicLink(
        user_id=user.id,
        email=normalize_email(email),
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
        used_at=None,
        created_at=datetime.utcnow(),
    )
    db.add(magic_link)
    db.commit()

    verify_url = f"{read_frontend_base_url()}/accedi/verifica?token={raw_token}"
    hours = max(1, expires_minutes // 60)
    send_email(
        to=email,
        subject="Il tuo link per il matrimonio",
        html_body=(
            f"<p>Ciao {user.first_name},</p>"
            f"<p>Usa questo link per rivedere o modificare la tua conferma:</p>"
            f'<p><a href="{verify_url}">{verify_url}</a></p>'
            f"<p>Il link resta valido per {hours} ore.</p>"
        ),
    )


def confirm_guest_rsvp(
    db: Session, token: str, payload: GuestRsvpConfirmRequest
) -> tuple[AuthSessionResponse, RsvpSubmitResponse]:
    invite_link = db.query(InviteLink).filter(InviteLink.token == token).first()
    if not invite_link:
        raise GuestInviteNotFoundError("Invite not found")

    user = get_or_create_guest_user(db, invite_link, payload.email)
    rsvp_payload = RSVPSubmitRequest(attending=payload.attending, guests=payload.guests)

    existing_rsvp = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    rsvp_response = (
        update_rsvp_for_user(db, user, rsvp_payload)
        if existing_rsvp
        else confirm_rsvp_for_user(db, user, rsvp_payload)
    )

    session = issue_auth_session(db, user, remember_me=True)
    _issue_and_send_magic_link(db, user, payload.email)
    return session, rsvp_response


def request_guest_magic_link(db: Session, email: str) -> None:
    normalized_email = normalize_email(email)
    user = (
        db.query(User)
        .filter(User.email == normalized_email, User.password_hash.is_(None))
        .first()
    )
    if not user:
        return
    _issue_and_send_magic_link(db, user, normalized_email)


def verify_guest_magic_link(db: Session, raw_token: str) -> AuthSessionResponse:
    token_hash = _hash_token(raw_token)
    link = db.query(GuestMagicLink).filter(GuestMagicLink.token_hash == token_hash).first()
    if not link or link.used_at is not None or link.expires_at <= datetime.utcnow():
        raise GuestMagicLinkInvalidError("This link is invalid or has expired.")

    link.used_at = datetime.utcnow()
    db.commit()

    user = db.query(User).filter(User.id == link.user_id).first()
    if not user:
        raise GuestMagicLinkInvalidError("This link is invalid or has expired.")

    return issue_auth_session(db, user, remember_me=True)
```

- [ ] **Step 5: Run to verify pass**

```bash
cd backend
./venv/bin/pytest tests/test_guest_access_service.py -v
```

Expected: PASS (7 tests). Note `test_send_email_posts_to_resend`-style calls will actually try to reach Resend unless `RESEND_API_KEY` is unset in the test environment — `conftest.py` does not set it, so `send_email` inside `_issue_and_send_magic_link` will raise `EmailSendError` during these tests. Fix this in Step 6.

- [ ] **Step 6: Make magic-link sending resilient to email failures in the confirm path**

A missing/misconfigured email provider must never block the RSVP confirmation itself (the confirmation is the important part; the "here's your link back" email is a nice-to-have). Wrap the send in `confirm_guest_rsvp` and `request_guest_magic_link` — but `request_guest_magic_link`'s whole job IS sending the email, so only guard the confirm path. Update `confirm_guest_rsvp` in `backend/services/guest_access_service.py`:

```python
    session = issue_auth_session(db, user, remember_me=True)
    try:
        _issue_and_send_magic_link(db, user, payload.email)
    except EmailSendError:
        pass  # confirmation still succeeds; the guest just won't get the recap email
    return session, rsvp_response
```

Add `EmailSendError` to the imports: `from services.email_service import EmailSendError, send_email`.

- [ ] **Step 7: Re-run the full test file**

```bash
cd backend
./venv/bin/pytest tests/test_guest_access_service.py tests/test_email_service.py -v
```

Expected: PASS, all tests green.

- [ ] **Step 8: Commit**

```bash
git add backend/schemas/guest_access_schema.py backend/services/guest_access_service.py \
  backend/tests/test_guest_access_service.py
git commit -m "$(cat <<'EOF'
feat(be): guest identity + magic-link service

Reuses the existing RSVP service unchanged — this only adds how a
User is obtained from an invite token + email, and the mono-use
24h magic link for returning without the original WhatsApp link.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Guest RSVP + magic-link HTTP routes

**Files:**
- Create: `backend/routes/guest_rsvp_route.py`
- Create: `backend/routes/guest_magic_link_route.py`
- Modify: `backend/schemas/invite_link_schema.py` (add party limits to the public invite lookup)
- Modify: `backend/routes/invite_link_route.py` (pass the limits through)
- Modify: `backend/main.py` (register the two new routers)
- Test: `backend/tests/test_guest_rsvp_api.py`
- Test: `backend/tests/test_guest_magic_link_api.py`

**Interfaces:**
- Consumes: everything from Task 3.
- Produces: `POST /invites/{token}/rsvp`, `POST /auth/guest-magic-link/request`, `GET /auth/guest-magic-link/verify`; `GET /invites/{token}` now also returns `min_party_guests`/`max_party_guests`.

- [ ] **Step 1: Extend the public invite lookup with party limits**

`backend/schemas/invite_link_schema.py` currently:
```python
class InviteLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
```
The frontend guest RSVP form needs `min`/`max` guest counts without an auth call — add them as plain fields (not read `from_attributes` off the ORM object, since `InviteLink` doesn't carry them):
```python
from constants.rsvp_party import MAX_PARTY_GUESTS, MIN_PARTY_GUESTS


class InviteLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    first_name: str
    last_name: str
    min_party_guests: int = MIN_PARTY_GUESTS
    max_party_guests: int = MAX_PARTY_GUESTS
```
Since these have defaults, `backend/routes/invite_link_route.py` needs no change — `InviteLinkResponse.model_validate(invite)` (via FastAPI's `response_model=InviteLinkResponse` and `from_attributes=True`) will fill them from the class defaults automatically. No edit needed there.

- [ ] **Step 2: Write the failing tests for the guest RSVP route**

Create `backend/tests/test_guest_rsvp_api.py`:
```python
from __future__ import annotations

from datetime import datetime

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink


@pytest.fixture
def invite_token(api_client):
    session = SessionLocal()
    invite = InviteLink(
        token="party-token-abc",
        first_name="Mario",
        last_name="Rossi",
        created_at=datetime.utcnow(),
    )
    session.add(invite)
    session.commit()
    session.close()
    return "party-token-abc"


def _guest_line(first_name="Mario", last_name="Rossi"):
    return {
        "first_name": first_name,
        "last_name": last_name,
        "meal_choice": "standard",
        "intolerance": "none",
    }


def test_invite_lookup_includes_party_limits(api_client, invite_token):
    response = api_client.get(f"/invites/{invite_token}")
    assert response.status_code == 200
    body = response.json()
    assert body["min_party_guests"] == 1
    assert body["max_party_guests"] == 10


def test_guest_rsvp_unknown_token_returns_404(api_client):
    response = api_client.post(
        "/invites/does-not-exist/rsvp",
        json={"email": "mario@example.com", "attending": True, "guests": [_guest_line()]},
    )
    assert response.status_code == 404


def test_guest_rsvp_confirms_and_returns_session(api_client, invite_token):
    response = api_client.post(
        f"/invites/{invite_token}/rsvp",
        json={"email": "mario@example.com", "attending": True, "guests": [_guest_line()]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["session"]["access_token"]
    assert body["session"]["user"]["email"] == "mario@example.com"
    assert body["rsvp"]["ok"] is True

    # The returned session actually works against the existing authenticated RSVP endpoint.
    access_token = body["session"]["access_token"]
    me_response = api_client.get("/rsvp/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_response.status_code == 200
    assert me_response.json()["has_rsvp"] is True


def test_guest_rsvp_second_submission_updates_instead_of_409(api_client, invite_token):
    payload = {"email": "mario@example.com", "attending": True, "guests": [_guest_line()]}
    first = api_client.post(f"/invites/{invite_token}/rsvp", json=payload)
    assert first.status_code == 200

    payload["guests"] = [_guest_line(), _guest_line("Giulia", "Rossi")]
    second = api_client.post(f"/invites/{invite_token}/rsvp", json=payload)
    assert second.status_code == 200
    assert second.json()["rsvp"]["guest_count"] == 2
```

- [ ] **Step 3: Run to verify failure**

```bash
cd backend
./venv/bin/pytest tests/test_guest_rsvp_api.py -v
```

Expected: FAIL — the party-limits assertions fail (schema not updated yet) and `/invites/{token}/rsvp` returns 404 Not Found (route doesn't exist).

- [ ] **Step 4: Implement `backend/routes/guest_rsvp_route.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.guest_access_schema import GuestRsvpConfirmRequest, GuestRsvpConfirmResponse
from services.guest_access_service import GuestInviteNotFoundError, confirm_guest_rsvp
from services.rsvp_service import RsvpDeadlineError

router = APIRouter(prefix="/invites")


# Public: confirms/updates an RSVP directly from the WhatsApp invite token,
# creating a passwordless guest account behind the scenes on first use.
@router.post("/{token}/rsvp", response_model=GuestRsvpConfirmResponse)
def confirm_rsvp_via_invite(
    token: str,
    payload: GuestRsvpConfirmRequest,
    db: Session = Depends(get_db),
):
    try:
        session, rsvp = confirm_guest_rsvp(db, token, payload)
    except GuestInviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except RsvpDeadlineError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return GuestRsvpConfirmResponse(session=session, rsvp=rsvp)
```

- [ ] **Step 5: Register the router in `backend/main.py`**

Add the import alongside the other route imports:
```python
from routes.guest_rsvp_route import router as guest_rsvp_router
```
and the registration alongside the others:
```python
app.include_router(guest_rsvp_router)
```

- [ ] **Step 6: Run to verify pass**

```bash
cd backend
./venv/bin/pytest tests/test_guest_rsvp_api.py -v
```

Expected: PASS (4 tests).

- [ ] **Step 7: Write the failing tests for the magic-link routes**

Create `backend/tests/test_guest_magic_link_api.py`:
```python
from __future__ import annotations

from datetime import datetime

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink


@pytest.fixture
def confirmed_guest_email(api_client):
    session = SessionLocal()
    invite = InviteLink(
        token="magic-token-xyz",
        first_name="Elena",
        last_name="Bianchi",
        created_at=datetime.utcnow(),
    )
    session.add(invite)
    session.commit()
    session.close()

    api_client.post(
        "/invites/magic-token-xyz/rsvp",
        json={
            "email": "elena@example.com",
            "attending": True,
            "guests": [
                {
                    "first_name": "Elena",
                    "last_name": "Bianchi",
                    "meal_choice": "standard",
                    "intolerance": "none",
                }
            ],
        },
    )
    return "elena@example.com"


def test_magic_link_request_is_always_200(api_client):
    response = api_client.post(
        "/auth/guest-magic-link/request", json={"email": "unknown@example.com"}
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_magic_link_request_for_known_guest_is_also_200(api_client, confirmed_guest_email):
    response = api_client.post(
        "/auth/guest-magic-link/request", json={"email": confirmed_guest_email}
    )
    assert response.status_code == 200


def test_magic_link_verify_rejects_bogus_token(api_client):
    response = api_client.get("/auth/guest-magic-link/verify", params={"token": "not-real"})
    assert response.status_code == 400
```

- [ ] **Step 8: Run to verify failure**

```bash
cd backend
./venv/bin/pytest tests/test_guest_magic_link_api.py -v
```

Expected: FAIL — both routes 404 (don't exist yet).

- [ ] **Step 9: Implement `backend/routes/guest_magic_link_route.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.auth_schema import AuthSessionResponse
from schemas.guest_access_schema import GuestMagicLinkRequest, GuestMagicLinkRequestResponse
from services.guest_access_service import (
    GuestMagicLinkInvalidError,
    request_guest_magic_link,
    verify_guest_magic_link,
)

router = APIRouter(prefix="/auth/guest-magic-link")


# Always returns 200 regardless of whether the email matches a guest — the
# alternative (404 for "not found") would let anyone probe the guest list.
@router.post("/request", response_model=GuestMagicLinkRequestResponse)
def request_magic_link(payload: GuestMagicLinkRequest, db: Session = Depends(get_db)):
    request_guest_magic_link(db, payload.email)
    return GuestMagicLinkRequestResponse()


@router.get("/verify", response_model=AuthSessionResponse)
def verify_magic_link(token: str = Query(...), db: Session = Depends(get_db)):
    try:
        return verify_guest_magic_link(db, token)
    except GuestMagicLinkInvalidError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
```

- [ ] **Step 10: Register the router in `backend/main.py`**

```python
from routes.guest_magic_link_route import router as guest_magic_link_router
...
app.include_router(guest_magic_link_router)
```

- [ ] **Step 11: Run to verify pass**

```bash
cd backend
./venv/bin/pytest tests/test_guest_magic_link_api.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 12: Run the full backend suite**

```bash
cd backend
./venv/bin/pytest -q
```

Expected: all tests pass, including every pre-existing file.

- [ ] **Step 13: Commit**

```bash
git add backend/routes/guest_rsvp_route.py backend/routes/guest_magic_link_route.py \
  backend/schemas/invite_link_schema.py backend/main.py \
  backend/tests/test_guest_rsvp_api.py backend/tests/test_guest_magic_link_api.py
git commit -m "$(cat <<'EOF'
feat(be): guest RSVP and magic-link HTTP routes

POST /invites/{token}/rsvp, POST /auth/guest-magic-link/request,
GET /auth/guest-magic-link/verify. The public invite lookup now also
returns party-size limits so the guest form can render without auth.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Frontend API client + session hydration

**Files:**
- Create: `frontend/src/services/guestAccessApi.ts`
- Modify: `frontend/src/services/inviteApi.ts` (party limits on the invite type)
- Modify: `frontend/src/contexts/AuthContext.tsx` (expose `applySession`)
- Test: `frontend/src/__tests__/guestAccessApi.test.ts` (type-level smoke test — see Step 1)

**Interfaces:**
- Consumes: `AuthSessionResponse`/`RsvpGuestLine`/`RsvpSubmitResponse` types (existing).
- Produces: `confirmGuestRsvp(token, payload) -> Promise<GuestRsvpConfirmResult>`; `requestGuestMagicLink(email) -> Promise<void>`; `verifyGuestMagicLink(token) -> Promise<AuthSessionResponse>`; `useAuth().applySession(session: AuthSessionResponse) -> Promise<AuthUser>`.

- [ ] **Step 1: Extend `frontend/src/services/inviteApi.ts` with party limits**

Current file:
```ts
export type InviteLink = { first_name: string; last_name: string };
export async function fetchInviteByToken(token: string): Promise<InviteLink> {
  const { data } = await apiClient.get<InviteLink>(`/invites/${token}`);
  return data;
}
```
Change to:
```ts
export type InviteLink = {
  first_name: string;
  last_name: string;
  min_party_guests: number;
  max_party_guests: number;
};

export async function fetchInviteByToken(token: string): Promise<InviteLink> {
  const { data } = await apiClient.get<InviteLink>(`/invites/${token}`);
  return data;
}
```

- [ ] **Step 2: Create `frontend/src/services/guestAccessApi.ts`**

```ts
import { apiClient } from '@/services/apiClient';
import type { AuthSessionResponse } from '@/services/authApi';
import type { RsvpGuestLine, RsvpSubmitResponse } from '@/services/rsvpApi';

export type GuestRsvpConfirmPayload = {
  email: string;
  attending: boolean;
  guests: RsvpGuestLine[];
};

export type GuestRsvpConfirmResult = {
  session: AuthSessionResponse;
  rsvp: RsvpSubmitResponse;
};

/** Confirms/updates an RSVP directly from the invite token — no prior session needed. */
export async function confirmGuestRsvp(
  token: string,
  payload: GuestRsvpConfirmPayload,
): Promise<GuestRsvpConfirmResult> {
  const { data } = await apiClient.post<GuestRsvpConfirmResult>(`/invites/${token}/rsvp`, payload);
  return data;
}

/** Requests a magic-link email for a guest who lost their WhatsApp invite link. */
export async function requestGuestMagicLink(email: string): Promise<void> {
  await apiClient.post('/auth/guest-magic-link/request', { email });
}

/** Exchanges a magic-link token (from the emailed URL) for a real session. */
export async function verifyGuestMagicLink(token: string): Promise<AuthSessionResponse> {
  const { data } = await apiClient.get<AuthSessionResponse>('/auth/guest-magic-link/verify', {
    params: { token },
  });
  return data;
}
```

- [ ] **Step 3: Add a type-level smoke test**

Create `frontend/src/__tests__/guestAccessApi.test.ts` (mirrors how this repo tests thin API wrappers — asserting the module imports cleanly and exports the expected functions, since the actual HTTP calls are exercised by the backend's own tests and by manual verification in Task 7):
```ts
import { describe, expect, it } from 'vitest';

import { confirmGuestRsvp, requestGuestMagicLink, verifyGuestMagicLink } from '@/services/guestAccessApi';

describe('guestAccessApi', () => {
  it('exports the three guest-access functions', () => {
    expect(typeof confirmGuestRsvp).toBe('function');
    expect(typeof requestGuestMagicLink).toBe('function');
    expect(typeof verifyGuestMagicLink).toBe('function');
  });
});
```

- [ ] **Step 4: Run it**

```bash
cd frontend
npx vitest run src/__tests__/guestAccessApi.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Expose `applySession` from `AuthContext`**

In `frontend/src/contexts/AuthContext.tsx`, extract the session-hydration logic `signIn`/`signUp` both duplicate into a shared helper, and expose it. Change the type:
```ts
type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  canManageWedding: boolean;
  isBootstrapping: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signUp: (payload: RegisterPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: UpdateProfilePayload) => Promise<void>;
  applySession: (session: AuthSessionResponse) => Promise<AuthUser>;
};
```
Add the import: `import type { AuthSessionResponse } from '@/services/authApi';` (add `AuthSessionResponse` to the existing `from '@/services/authApi'` import list — it's already exported there).

Add the shared helper and rewrite `signIn`/`signUp` to use it:
```ts
  async function applySession(sessionResponse: AuthSessionResponse) {
    await setCurrentSession({
      accessToken: sessionResponse.access_token,
      refreshToken: sessionResponse.refresh_token,
      rememberMe: sessionResponse.remember_me,
    });
    setUser(sessionResponse.user);
    return sessionResponse.user;
  }

  async function signIn(payload: LoginPayload) {
    try {
      const sessionResponse = await loginAccount(payload);
      return await applySession(sessionResponse);
    } catch (caughtError) {
      throw new Error(
        getAuthApiErrorMessage(caughtError, translate, 'login', translate('login.genericError')),
      );
    }
  }

  async function signUp(payload: RegisterPayload) {
    try {
      const sessionResponse = await registerAccount(payload);
      return await applySession(sessionResponse);
    } catch (caughtError) {
      throw new Error(
        getAuthApiErrorMessage(caughtError, translate, 'register', translate('register.genericError')),
      );
    }
  }
```
And add `applySession` to the `contextValue` object:
```ts
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      canManageWedding: isAdmin(user?.role),
      isBootstrapping,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      saveProfile,
      applySession,
    }),
    [user, isBootstrapping],
  );
```

- [ ] **Step 6: Type-check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/guestAccessApi.ts frontend/src/services/inviteApi.ts \
  frontend/src/contexts/AuthContext.tsx frontend/src/__tests__/guestAccessApi.test.ts
git commit -m "$(cat <<'EOF'
feat(fe): guest-access API client and session hydration

AuthContext exposes applySession so a page can adopt a session it
got from somewhere other than /auth/login — the guest RSVP confirm
and magic-link verify responses, in the next tasks.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Guest RSVP page (first confirmation, no auth)

**Files:**
- Create: `frontend/src/pages/GuestRsvpPage/GuestRsvpPage.tsx`
- Create: `frontend/src/pages/GuestRsvpPage/useGuestRsvpDraft.ts`
- Create: `frontend/src/pages/GuestRsvpPage/mapGuestRsvpError.ts`
- Create: `frontend/src/pages/GuestRsvpPage/index.ts`
- Create: `frontend/src/pages/GuestRsvpPage/styles/GuestRsvpPage.scss`
- Test: `frontend/src/pages/GuestRsvpPage/__tests__/mapGuestRsvpError.test.ts`

**Interfaces:**
- Consumes: `fetchInviteByToken` (Task 5), `confirmGuestRsvp` (Task 5), `useAuth().applySession` (Task 5), `RsvpPartyForm` (existing, unmodified — its submit button is reused as-is), `buildAccountHolderGuestLine`/`draftsToGuestPayload`/`validateRsvpGuestLines` (existing, unmodified). `RsvpConfirmedSummary` is **not** used here — this page never shows a confirmed/edit view, it hands off to the existing `/rsvp` page for that once the guest has a session.
- Produces: route component for `/invito/:token/rsvp`.

This page only ever handles the **first, unauthenticated** confirmation. Once a guest has confirmed once, they have a real session (from `applySession`) and any further viewing/editing happens on the existing `/rsvp` page — this page never needs an "edit" mode.

This codebase's test convention (see `frontend/src/__tests__/*.test.ts`) is pure-function unit tests only — there is no `@testing-library/react`/jsdom setup, so hooks and components are not rendered in tests. Rather than add that infrastructure for one hook, extract the one genuinely pure decision this hook makes — mapping a failed request's status code to a copy key — into its own tested module, and leave `useGuestRsvpDraft`'s React wiring to the manual browser verification in Step 8 of the next task.

- [ ] **Step 1: Write the failing test for the pure error-mapping function**

Create `frontend/src/pages/GuestRsvpPage/__tests__/mapGuestRsvpError.test.ts`:
```ts
import { describe, expect, it } from 'vitest';

import { mapGuestRsvpErrorToMessageKey } from '@/pages/GuestRsvpPage/mapGuestRsvpError';

describe('mapGuestRsvpErrorToMessageKey', () => {
  it('maps a 403 (deadline closed) to the deadline copy key', () => {
    expect(mapGuestRsvpErrorToMessageKey(403)).toBe('rsvp.deadlineClosedError');
  });

  it('maps a 404 (unknown invite token) to the invite-not-found copy key', () => {
    expect(mapGuestRsvpErrorToMessageKey(404)).toBe('invite.notFoundBody');
  });

  it('maps anything else, including undefined, to the generic submit-error key', () => {
    expect(mapGuestRsvpErrorToMessageKey(500)).toBe('rsvp.submitError');
    expect(mapGuestRsvpErrorToMessageKey(undefined)).toBe('rsvp.submitError');
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd frontend
npx vitest run src/pages/GuestRsvpPage/__tests__/mapGuestRsvpError.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `frontend/src/pages/GuestRsvpPage/mapGuestRsvpError.ts`**

```ts
import type { TranslationKey } from '@/i18n/translations';

/** Maps a failed guest-RSVP-confirm HTTP status to the copy key to show. */
export function mapGuestRsvpErrorToMessageKey(statusCode: number | undefined): TranslationKey {
  if (statusCode === 403) {
    return 'rsvp.deadlineClosedError';
  }
  if (statusCode === 404) {
    return 'invite.notFoundBody';
  }
  return 'rsvp.submitError';
}
```

- [ ] **Step 4: Run to verify pass**

```bash
cd frontend
npx vitest run src/pages/GuestRsvpPage/__tests__/mapGuestRsvpError.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Implement `frontend/src/pages/GuestRsvpPage/useGuestRsvpDraft.ts`**

```ts
import { useCallback, useMemo, useState } from 'react';

import {
  buildAccountHolderGuestLine,
  draftsToGuestPayload,
} from '@/components/Rsvp/buildInitialGuestLines';
import type { RsvpGuestDraft } from '@/components/Rsvp/types/RsvpGuestDraft';
import { validateRsvpGuestLines, type RsvpGuestFieldError } from '@/components/Rsvp/validateRsvpGuestLines';
import { useAuth } from '@/contexts/AuthContext';
import type { TranslateFn } from '@/i18n/translations';
import { confirmGuestRsvp } from '@/services/guestAccessApi';
import { getApiStatusCode } from '@/services/apiErrors';
import { isFactionId } from '@/constants/factions';
import type { FactionId } from '@/services/rsvpApi';
import { mapGuestRsvpErrorToMessageKey } from '@/pages/GuestRsvpPage/mapGuestRsvpError';

type InvitePrefill = { first_name: string; last_name: string };

export type UseGuestRsvpDraftResult = {
  attending: boolean;
  guests: RsvpGuestDraft[];
  fieldErrors: RsvpGuestFieldError[];
  submitting: boolean;
  error: string | null;
  confirmed: boolean;
  confirmedFaction: FactionId | null;
  setAttending: (attending: boolean) => void;
  setGuests: (guests: RsvpGuestDraft[]) => void;
  /** Reads the current email from a ref so this can be passed straight as
   * RsvpPartyForm's onSubmit (which takes no arguments) — see GuestRsvpPage. */
  submit: () => Promise<void>;
  email: string;
  setEmail: (email: string) => void;
};

/**
 * Same shape of concerns as `useRsvpDraft` (see pages/RsvpPage/useRsvpDraft.ts)
 * but for the *unauthenticated first confirmation only* — there is no
 * existing RSVP to load, and a successful submit hands the guest a real
 * session via `applySession` instead of just updating local state.
 */
export function useGuestRsvpDraft(
  token: string,
  invitePrefill: InvitePrefill,
  t: TranslateFn,
): UseGuestRsvpDraftResult {
  const { applySession } = useAuth();
  const [attending, setAttendingState] = useState(true);
  const [guests, setGuests] = useState<RsvpGuestDraft[]>(() => [
    buildAccountHolderGuestLine(invitePrefill),
  ]);
  const [fieldErrors, setFieldErrors] = useState<RsvpGuestFieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedFaction, setConfirmedFaction] = useState<FactionId | null>(null);
  const [email, setEmail] = useState('');

  const setAttending = useCallback(
    (nextAttending: boolean) => {
      setAttendingState(nextAttending);
      if (nextAttending && guests.length === 0) {
        setGuests([buildAccountHolderGuestLine(invitePrefill)]);
      }
    },
    [guests.length, invitePrefill],
  );

  const submit = useCallback(async () => {
    if (!email.trim()) {
      setError(t('guestRsvp.emailRequiredError'));
      return;
    }
    if (attending) {
      const validationErrors = validateRsvpGuestLines(guests);
      if (validationErrors.length > 0) {
        setFieldErrors(validationErrors);
        return;
      }
    }
    setFieldErrors([]);

    try {
      setSubmitting(true);
      setError(null);

      const result = await confirmGuestRsvp(token, {
        email: email.trim(),
        attending,
        guests: attending ? draftsToGuestPayload(guests) : [],
      });

      await applySession(result.session);
      setConfirmedFaction(isFactionId(result.rsvp.faction) ? result.rsvp.faction : null);
      setConfirmed(true);
    } catch (caughtError) {
      const statusCode = getApiStatusCode(caughtError);
      setError(t(mapGuestRsvpErrorToMessageKey(statusCode)));
    } finally {
      setSubmitting(false);
    }
  }, [applySession, attending, email, guests, t, token]);

  return useMemo(
    () => ({
      attending,
      guests,
      fieldErrors,
      submitting,
      error,
      confirmed,
      confirmedFaction,
      email,
      setAttending,
      setGuests,
      setEmail,
      submit,
    }),
    [
      attending,
      guests,
      fieldErrors,
      submitting,
      error,
      confirmed,
      confirmedFaction,
      email,
      setAttending,
      submit,
    ],
  );
}
```

(`isFactionId` lives in `frontend/src/constants/factions.ts:10`; `FactionId` itself is defined and exported from `frontend/src/services/rsvpApi.ts:3` — `constants/factions.ts` only imports the type, it doesn't re-export it, hence the two separate import lines above.)

- [ ] **Step 6: Type-check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors. (`useGuestRsvpDraft` has no dedicated automated test beyond `mapGuestRsvpError` above — its wiring is verified manually in Task 8's browser walkthrough, consistent with this codebase not rendering hooks/components in tests.)

- [ ] **Step 7: Implement the page component `frontend/src/pages/GuestRsvpPage/GuestRsvpPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { RsvpPartyForm } from '@/components/Rsvp/RsvpPartyForm';
import { useI18n } from '@/contexts/I18nContext';
import { fetchInviteByToken, type InviteLink } from '@/services/inviteApi';
import { useGuestRsvpDraft } from '@/pages/GuestRsvpPage/useGuestRsvpDraft';
import './styles/GuestRsvpPage.scss';

type LoadState = 'loading' | 'ready' | 'error';

/** First, unauthenticated RSVP confirmation reached from the WhatsApp invite link. */
export function GuestRsvpPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useI18n();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [invite, setInvite] = useState<InviteLink | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadState('error');
      return;
    }
    let isMounted = true;
    fetchInviteByToken(token)
      .then((result) => {
        if (isMounted) {
          setInvite(result);
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (isMounted) setLoadState('error');
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  const draft = useGuestRsvpDraft(
    token ?? '',
    invite ?? { first_name: '', last_name: '' },
    t,
  );

  if (loadState === 'loading') {
    return (
      <div className="obw-page guest-rsvp-page guest-rsvp-page--centered">
        <p className="obw-body">{t('common.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error' || !invite) {
    return (
      <div className="obw-page guest-rsvp-page guest-rsvp-page--centered">
        <h1 className="obw-display obw-display--sm">{t('invite.notFoundTitle')}</h1>
        <p className="obw-body">{t('invite.notFoundBody')}</p>
      </div>
    );
  }

  if (draft.confirmed) {
    return (
      <div className="obw-page guest-rsvp-page guest-rsvp-page--centered">
        <h1 className="obw-display obw-display--lg">{t('guestRsvp.confirmedTitle')}</h1>
        <p className="obw-body">{t('guestRsvp.confirmedBody', { email: draft.email })}</p>
      </div>
    );
  }

  return (
    <div className="obw-page guest-rsvp-page">
      <div className="obw-container guest-rsvp-page__inner">
        <header className="guest-rsvp-page__header">
          <h1 className="obw-display obw-display--lg">
            {invite.first_name} {invite.last_name}
          </h1>
          <p className="obw-body">{t('guestRsvp.intro')}</p>
        </header>

        <label className="obw-field guest-rsvp-page__email" htmlFor="guest-rsvp-email">
          <span className="obw-field-label">{t('guestRsvp.emailLabel')}</span>
          <input
            id="guest-rsvp-email"
            className="obw-input"
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) => draft.setEmail(event.target.value)}
          />
          <span className="obw-field-hint">{t('guestRsvp.emailHint')}</span>
        </label>

        {draft.error ? <p className="auth-form__error">{draft.error}</p> : null}

        {/* RsvpPartyForm renders its own submit button (labelled via the
            shared rsvp.submitLabel/submitLoading keys) — reused as-is here
            instead of adding a second button; onSubmit reads draft.email
            via the hook's own state, so the button needs no extra prop. */}
        <RsvpPartyForm
          attending={draft.attending}
          guests={draft.guests}
          submitting={draft.submitting}
          isEditMode={false}
          fieldErrors={draft.fieldErrors}
          partyLimits={{ min: invite.min_party_guests, max: invite.max_party_guests }}
          onAttendingChange={draft.setAttending}
          onGuestsChange={draft.setGuests}
          onSubmit={() => void draft.submit()}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create `frontend/src/pages/GuestRsvpPage/index.ts`**

```ts
export { GuestRsvpPage } from './GuestRsvpPage';
```

- [ ] **Step 9: Create `frontend/src/pages/GuestRsvpPage/styles/GuestRsvpPage.scss`**

```scss
.guest-rsvp-page--centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  gap: var(--obw-space-sm);
}

.guest-rsvp-page__inner {
  display: flex;
  flex-direction: column;
  gap: var(--obw-space-lg);
}

.guest-rsvp-page__header {
  text-align: center;
}

.guest-rsvp-page__email {
  max-width: 28rem;
}
```

- [ ] **Step 10: Add the new i18n keys**

Add a `guestRsvp` namespace to all four locale files (`frontend/src/i18n/locales/{it,en,fr,de}.ts`), alongside the existing `invite`/`rsvp` namespaces. Italian (`it.ts`):
```ts
  guestRsvp: {
    intro: 'Conferma la tua presenza e quella del tuo gruppo.',
    emailLabel: 'La tua email',
    emailHint: "Non serve una password — l'email serve solo per ricevere il link per rientrare più tardi.",
    emailRequiredError: 'Inserisci la tua email prima di confermare.',
    confirmedTitle: 'Grazie, è tutto segnato.',
    confirmedBody: 'Ti abbiamo mandato un riepilogo a {{email}}. Nella stessa email trovi il link per rientrare.',
  },
```
English (`en.ts`):
```ts
  guestRsvp: {
    intro: 'Confirm your attendance and your group’s.',
    emailLabel: 'Your email',
    emailHint: "No password needed — the email is only used to send you the link back later.",
    emailRequiredError: 'Enter your email before confirming.',
    confirmedTitle: 'Thank you, all set.',
    confirmedBody: "We've sent a recap to {{email}}. The same email has your link back in.",
  },
```
French (`fr.ts`):
```ts
  guestRsvp: {
    intro: 'Confirmez votre présence et celle de votre groupe.',
    emailLabel: 'Votre email',
    emailHint: "Pas besoin de mot de passe — l'email sert seulement à vous renvoyer le lien plus tard.",
    emailRequiredError: 'Indiquez votre email avant de confirmer.',
    confirmedTitle: "Merci, c'est noté.",
    confirmedBody: 'Nous avons envoyé un récapitulatif à {{email}}. Le lien de retour y figure.',
  },
```
German (`de.ts`):
```ts
  guestRsvp: {
    intro: 'Bestätige deine Teilnahme und die deiner Gruppe.',
    emailLabel: 'Deine E-Mail',
    emailHint: 'Kein Passwort nötig — die E-Mail dient nur dazu, dir später den Link erneut zu schicken.',
    emailRequiredError: 'Gib deine E-Mail ein, bevor du bestätigst.',
    confirmedTitle: 'Danke, alles eingetragen.',
    confirmedBody: 'Wir haben eine Zusammenfassung an {{email}} geschickt. Darin findest du den Link zum Zurückkehren.',
  },
```

- [ ] **Step 11: Type-check and run all frontend tests**

```bash
cd frontend
npx tsc --noEmit
npx vitest run
```

Expected: no type errors, all tests pass (route wiring happens in Task 8, so this page isn't reachable yet — that's fine, it still compiles and its own tests pass).

- [ ] **Step 12: Commit**

```bash
git add frontend/src/pages/GuestRsvpPage frontend/src/i18n/locales
git commit -m "$(cat <<'EOF'
feat(fe): guest RSVP page for the first, unauthenticated confirmation

Reuses the existing RsvpPartyForm unmodified; on submit it calls the
new guest endpoint and adopts the returned session via applySession.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Magic-link verify + recovery pages

**Files:**
- Create: `frontend/src/pages/GuestAccessVerifyPage/GuestAccessVerifyPage.tsx`
- Create: `frontend/src/pages/GuestAccessVerifyPage/index.ts`
- Create: `frontend/src/pages/GuestAccessRecoveryPage/GuestAccessRecoveryPage.tsx`
- Create: `frontend/src/pages/GuestAccessRecoveryPage/index.ts`
- Create: `frontend/src/pages/GuestAccessRecoveryPage/styles/GuestAccessRecoveryPage.scss`

**Interfaces:**
- Consumes: `verifyGuestMagicLink`/`requestGuestMagicLink` (Task 5), `useAuth().applySession` (Task 5).
- Produces: route components for `/accedi/verifica` and `/accedi/recupera`.

- [ ] **Step 1: Implement `frontend/src/pages/GuestAccessVerifyPage/GuestAccessVerifyPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { verifyGuestMagicLink } from '@/services/guestAccessApi';

type VerifyState = 'verifying' | 'error';

/** Landing page for the emailed magic-link URL — exchanges the token for a real session. */
export function GuestAccessVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applySession } = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState<VerifyState>('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      return;
    }

    let isMounted = true;
    verifyGuestMagicLink(token)
      .then(async (session) => {
        await applySession(session);
        if (isMounted) {
          navigate('/rsvp', { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) setState('error');
      });

    return () => {
      isMounted = false;
    };
  }, [applySession, navigate, searchParams]);

  if (state === 'verifying') {
    return (
      <div className="obw-page guest-access-verify-page">
        <p className="obw-body">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="obw-page guest-access-verify-page">
      <h1 className="obw-display obw-display--sm">{t('guestAccess.verifyErrorTitle')}</h1>
      <p className="obw-body">{t('guestAccess.verifyErrorBody')}</p>
      <Link className="obw-btn obw-btn--primary" to="/accedi/recupera">
        {t('guestAccess.requestNewLink')}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/GuestAccessVerifyPage/index.ts`**

```ts
export { GuestAccessVerifyPage } from './GuestAccessVerifyPage';
```

- [ ] **Step 3: Implement `frontend/src/pages/GuestAccessRecoveryPage/GuestAccessRecoveryPage.tsx`**

```tsx
import { useState } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import { requestGuestMagicLink } from '@/services/guestAccessApi';
import './styles/GuestAccessRecoveryPage.scss';

/** "Hai perso il link?" — requests a fresh magic-link email by address. */
export function GuestAccessRecoveryPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestGuestMagicLink(email.trim());
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <div className="obw-page guest-access-recovery-page">
      <div className="obw-container guest-access-recovery-page__inner">
        <h1 className="obw-display obw-display--sm">{t('guestAccess.recoveryTitle')}</h1>
        <p className="obw-body">{t('guestAccess.recoveryIntro')}</p>

        {sent ? (
          <p className="obw-body">{t('guestAccess.recoverySent')}</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <label className="obw-field" htmlFor="recovery-email">
              <span className="obw-field-label">{t('common.fields.email')}</span>
              <input
                id="recovery-email"
                className="obw-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="obw-btn obw-btn--primary obw-btn--block"
              disabled={submitting || !email.trim()}>
              {t('guestAccess.recoverySubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/pages/GuestAccessRecoveryPage/index.ts`**

```ts
export { GuestAccessRecoveryPage } from './GuestAccessRecoveryPage';
```

- [ ] **Step 5: Create `frontend/src/pages/GuestAccessRecoveryPage/styles/GuestAccessRecoveryPage.scss`**

```scss
.guest-access-recovery-page__inner {
  max-width: 28rem;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--obw-space-md);
  text-align: center;
}
```

- [ ] **Step 6: Add the `guestAccess` i18n namespace to all four locale files**

Italian:
```ts
  guestAccess: {
    recoveryTitle: 'Hai perso il link?',
    recoveryIntro: "Scrivi l'email che ci hai lasciato: ti rimandiamo l'accesso al tuo invito.",
    recoverySubmit: 'Rimandami il link',
    recoverySent: 'Se l’indirizzo corrisponde a un invito, controlla la posta: il link resta valido 24 ore.',
    verifyErrorTitle: 'Link non valido.',
    verifyErrorBody: 'Il link potrebbe essere scaduto o già usato.',
    requestNewLink: 'Richiedi un nuovo link',
  },
```
English:
```ts
  guestAccess: {
    recoveryTitle: 'Lost your link?',
    recoveryIntro: "Enter the email you left us and we'll send your invite access back.",
    recoverySubmit: 'Send me the link',
    recoverySent: 'If that address matches an invite, check your inbox: the link stays valid for 24 hours.',
    verifyErrorTitle: 'Invalid link.',
    verifyErrorBody: 'This link may have expired or already been used.',
    requestNewLink: 'Request a new link',
  },
```
French:
```ts
  guestAccess: {
    recoveryTitle: 'Vous avez perdu le lien ?',
    recoveryIntro: "Indiquez l'email laissé : nous vous renvoyons l'accès à votre invitation.",
    recoverySubmit: 'Renvoyer le lien',
    recoverySent: 'Si cette adresse correspond à une invitation, vérifiez votre boîte mail : le lien reste valable 24 heures.',
    verifyErrorTitle: 'Lien invalide.',
    verifyErrorBody: 'Ce lien a peut-être expiré ou déjà été utilisé.',
    requestNewLink: 'Demander un nouveau lien',
  },
```
German:
```ts
  guestAccess: {
    recoveryTitle: 'Link verloren?',
    recoveryIntro: 'Gib die hinterlegte E-Mail ein: wir schicken dir den Zugang zu deiner Einladung erneut.',
    recoverySubmit: 'Link erneut senden',
    recoverySent: 'Falls die Adresse zu einer Einladung passt, sieh in deinem Postfach nach: der Link bleibt 24 Stunden gültig.',
    verifyErrorTitle: 'Ungültiger Link.',
    verifyErrorBody: 'Dieser Link ist möglicherweise abgelaufen oder wurde bereits verwendet.',
    requestNewLink: 'Neuen Link anfordern',
  },
```

- [ ] **Step 7: Type-check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/GuestAccessVerifyPage frontend/src/pages/GuestAccessRecoveryPage \
  frontend/src/i18n/locales
git commit -m "$(cat <<'EOF'
feat(fe): magic-link verify and recovery pages

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Wire it all up — routes, EnvelopeInvite CTA, LoginPage

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/AuthGuard/authRouteAccess.ts`
- Modify: `frontend/src/components/EnvelopeInvite/EnvelopeInvite.tsx`
- Modify: `frontend/src/pages/InvitePage/InvitePage.tsx`
- Modify: `frontend/src/pages/LoginPage/LoginPage.tsx`

**Interfaces:**
- Consumes: `GuestRsvpPage`, `GuestAccessVerifyPage`, `GuestAccessRecoveryPage` (Tasks 6-7).

- [ ] **Step 1: Add the new routes to `frontend/src/App.tsx`**

Add the imports:
```tsx
import { GuestAccessRecoveryPage } from '@/pages/GuestAccessRecoveryPage/index';
import { GuestAccessVerifyPage } from '@/pages/GuestAccessVerifyPage/index';
import { GuestRsvpPage } from '@/pages/GuestRsvpPage/index';
```
Add the routes next to the existing `/invito/:token` route (same standalone group, outside `AppLayout`):
```tsx
              <Route path="/invito/:token" element={<InvitePage />} />
              <Route path="/invito/:token/rsvp" element={<GuestRsvpPage />} />
              <Route path="/accedi/verifica" element={<GuestAccessVerifyPage />} />
              <Route path="/accedi/recupera" element={<GuestAccessRecoveryPage />} />
```

- [ ] **Step 2: Add the new public paths to `frontend/src/components/AuthGuard/authRouteAccess.ts`**

`/invito/:token/rsvp` is already covered by the existing `PUBLIC_PATH_PREFIXES = ['/invito/']` prefix match — no change needed there. Add the two new exact paths to `PUBLIC_PATHS`:
```ts
const PUBLIC_PATHS = new Set([
  '/',
  '/album',
  '/auth/login',
  '/auth/register',
  '/accedi/verifica',
  '/accedi/recupera',
  ...DEV_PUBLIC_PATHS,
]);
```

- [ ] **Step 3: Pass the token through `InvitePage` to `EnvelopeInvite`**

In `frontend/src/pages/InvitePage/InvitePage.tsx`, change the render to also pass `token`:
```tsx
  return (
    <div className="invite-page">
      <EnvelopeInvite token={token ?? ''} firstName={invite.first_name} lastName={invite.last_name} />
    </div>
  );
```

- [ ] **Step 4: Change the RSVP CTA in `EnvelopeInvite.tsx`**

Add `token` to the props type:
```tsx
type EnvelopeInviteProps = {
  token: string;
  firstName: string;
  lastName: string;
};

export function EnvelopeInvite({ token, firstName, lastName }: EnvelopeInviteProps) {
```
Replace the CTA (currently a `<Link to="/auth/register" state={{ from: '/rsvp', prefill: {...} }}>`):
```tsx
              <Link
                className="obw-btn obw-btn--primary envelope-invite__cta"
                to="/auth/register"
                state={{ from: '/rsvp', prefill: { firstName, lastName } }}
                tabIndex={isOpen ? 0 : -1}>
                {t('invite.rsvpSection.yes')}
              </Link>
```
with:
```tsx
              <Link
                className="obw-btn obw-btn--primary envelope-invite__cta"
                to={`/invito/${token}/rsvp`}
                tabIndex={isOpen ? 0 : -1}>
                {t('invite.rsvpSection.yes')}
              </Link>
```

- [ ] **Step 5: Remove the "Registrati" link from `LoginPage.tsx`**

Delete this block (guests never need it now — the WhatsApp invite token is the only way in, and the couple/admin already have accounts):
```tsx
        <p className="auth-form__footer">
          <Link className="auth-form__footer-link" to="/auth/register" state={{ from: redirectTarget }}>
            {t('login.registerLink')}
          </Link>
        </p>
```
Check whether `Link` is still used elsewhere in this file after the removal — it is not (this was its only use besides the import), so also remove `Link` from the `react-router-dom` import: change
```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
```
to
```tsx
import { useLocation, useNavigate } from 'react-router-dom';
```
Leave the `login.registerLink` i18n key in place — it is still used dynamically as a page title by `AuthStackLayout.tsx` (`t(\`navigation.stack.${titleKey}\`)` resolves to a *different* key, `navigation.stack.register`, so double check with `grep -rn "login.registerLink" frontend/src` before deciding whether to remove it; if that grep shows no other usages, delete the key from all 4 locale files instead of leaving it dangling).

- [ ] **Step 6: Type-check**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors. If `EnvelopeInvite`'s existing tests (if any) construct the component without a `token` prop, fix those call sites too — check with `grep -rn "<EnvelopeInvite" frontend/src`.

- [ ] **Step 7: Run the full frontend test suite**

```bash
cd frontend
npx vitest run
```

Expected: all pass.

- [ ] **Step 8: Manual verification in the browser**

```bash
./scripts/run-dev.sh
```
Then, from `backend/`, generate a fresh invite token (`./venv/bin/python scripts/generate_invite_links.py ...` per the README) and:
1. Open `http://localhost:5173/invito/<token>` — confirm the envelope opens as before.
2. Tap "Conferma la presenza" — confirm it navigates to `/invito/<token>/rsvp` and shows the party form pre-filled with the invite's name.
3. Fill in the party, enter an email, submit — confirm the success screen appears and (if `RESEND_API_KEY` is set) an email arrives with a working `/accedi/verifica?token=...` link.
4. Reload `/rsvp` directly — confirm it now shows the confirmed summary (the session from step 3 persisted).
5. Visit `/accedi/recupera`, request a link for the same email, click it from the email — confirm it lands back on `/rsvp` already signed in.
6. Visit `/auth/login` — confirm "Registrati" is gone.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/AuthGuard/authRouteAccess.ts \
  frontend/src/components/EnvelopeInvite/EnvelopeInvite.tsx frontend/src/pages/InvitePage/InvitePage.tsx \
  frontend/src/pages/LoginPage/LoginPage.tsx
git commit -m "$(cat <<'EOF'
feat(fe): wire the passwordless guest RSVP flow end to end

Envelope CTA goes to the new token-based RSVP page instead of public
registration; LoginPage no longer offers to register.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** every section of `2026-08-26-passwordless-guest-rsvp-design.md` maps to a task — data model (Task 1), backend flow steps 1-3 (Tasks 3-4), frontend (Tasks 5-8), security properties (mono-use/expiring magic link in Task 1/3, token-only invite access unchanged, uniform recovery response in Task 4). Explicit out-of-scope items (admin UI, 2FA, party-size prefill) are not touched by any task.
- **Type consistency:** `GuestRsvpConfirmResult`/`GuestRsvpConfirmResponse` field names (`session`, `rsvp`) match between backend schema (Task 3) and frontend type (Task 5). `AuthSessionResponse` is the same shape returned by `/auth/login`, `/auth/register`, the new guest-confirm endpoint, and the new verify endpoint — `applySession` (Task 5) is the single place that consumes it, used by both new pages (Tasks 6-7).
- **Verified during planning, not left as a guess:** `RsvpPartyForm` (`frontend/src/components/Rsvp/RsvpPartyForm.tsx:117-127`) already renders its own submit button. Task 6 reuses it directly (email lives in the hook's own state, read by `submit()` with no arguments) instead of adding a second button or a new prop to a shared component.
