# Invite requests — backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let guests without their WhatsApp link request an invite from the site, notify the couple on Telegram, and give the admin API to approve requests and send every invite through a one-tap `wa.me` link; plus a token-scoped read of an existing RSVP so the invite page can prefill on return.

**Architecture:** New `invite_requests` table and an `invite_links.sent_at` column (one Alembic migration). Thin FastAPI routes over focused services: phone normalisation, an in-memory sliding-window rate limiter, a Telegram notifier run as a `BackgroundTask`, invite message/URL building, and the request/approval service. Token generation moves from the CLI script into `invite_link_service` so the script and the approval flow share it.

**Tech Stack:** FastAPI 0.128, SQLAlchemy 2.0, Alembic 1.16, Pydantic 2, httpx 0.28 (already installed), pytest against Postgres (`tests/conftest.py` rebuilds the schema from migrations).

**Spec:** `docs/superpowers/specs/2026-10-01-invite-requests-design.md`

## Global Constraints

- All commands run from `backend/` with the venv active (`./venv/bin/pytest`, `./venv/bin/alembic`).
- Public endpoint answers **`202 Accepted` with the same body** whether or not the phone already has an invite, and when the honeypot is filled (nothing saved then).
- Phone stored normalised to E.164 (`+393331234567`); default prefix `+39` when the number has none; 8–15 digits.
- Rate limits: **3 requests/hour per phone**, **10 requests/hour per IP**; over the limit → `429`.
- Telegram config from env **`TELEGRAM_BOT_TOKEN`** and **`TELEGRAM_CHAT_ID`**; if either is missing, skip silently (info log). Timeout **3 s**. A Telegram failure never fails the request.
- WhatsApp message template, verbatim: `Ciao {first_name}! Davide e Ilaria ti aspettano il 31 maggio 2027 🕊️ Ecco il tuo invito personale: {invite_url}`
- WhatsApp URL: `https://wa.me/{phone digits, no +}?text={url-encoded message}`; with no phone: `https://wa.me/?text=…`.
- Invite URL: `{SITE_URL}/invito/{token}`, `SITE_URL` env default `http://localhost:5173`.
- Admin routes require `require_admin_user` (same as other `/admin` routes).
- `GET /invites/{token}` and `GET /invites/{token}/rsvp` never expose the phone.
- Out of scope here (separate plans): admin "Inviti" page, frontend prefill, faction removal.

---

## File Structure

| File | Responsibility |
|---|---|
| `settings.py` (modify) | `read_site_url`, `read_telegram_bot_token`, `read_telegram_chat_id` |
| `models/invite_request_model.py` (create) | `InviteRequest` ORM model |
| `models/invite_link_model.py` (modify) | add `sent_at` |
| `alembic/versions/20261001_0014_invite_requests.py` (create) | table + column |
| `tests/conftest.py` (modify) | truncate `invite_requests` |
| `services/phone_service.py` (create) | `normalize_phone`, `InvalidPhoneError` |
| `services/rate_limit_service.py` (create) | `SlidingWindowLimiter` |
| `services/invite_link_service.py` (modify) | `generate_unique_token` (moved from script), `build_invite_url` |
| `scripts/generate_invite_links.py` (modify) | import `generate_unique_token` |
| `services/invite_message_service.py` (create) | `build_whatsapp_url` |
| `services/telegram_notify_service.py` (create) | `notify_new_invite_request` |
| `services/invite_request_service.py` (create) | create / list / count / approve / reject / list invites / mark sent |
| `schemas/invite_request_schema.py` (create) | request/response models |
| `routes/invite_request_route.py` (create) | `POST /invite-requests` |
| `routes/admin_invite_route.py` (create) | `/admin/invite-requests…`, `/admin/invites…` |
| `routes/invite_link_route.py` (modify) | `GET /invites/{token}/rsvp` |
| `main.py` (modify) | include the two new routers |
| `env.example` (modify) | document the three new variables |

Tests: `tests/test_phone_service.py`, `tests/test_rate_limit_service.py`, `tests/test_invite_message_service.py`, `tests/test_telegram_notify_service.py`, `tests/test_invite_requests_api.py`, `tests/test_admin_invites_api.py`, plus additions to `tests/test_guest_rsvp_api.py`.

---

### Task 1: Data model, migration and settings

**Files:**
- Create: `models/invite_request_model.py`, `alembic/versions/20261001_0014_invite_requests.py`
- Modify: `models/invite_link_model.py`, `settings.py`, `tests/conftest.py`, `env.example`
- Test: `tests/test_alembic_bootstrap.py` (existing — must still pass)

**Interfaces:**
- Produces: `InviteRequest` (columns below), `InviteLink.sent_at`, `read_site_url() -> str`, `read_telegram_bot_token() -> str`, `read_telegram_chat_id() -> str`. Status values are the strings `"pending"`, `"approved"`, `"rejected"`.

- [ ] **Step 1: Write the model**

`models/invite_request_model.py`:
```python
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.base import Base


# A guest without their WhatsApp link asks for one from the site; the couple
# approves (which creates or reuses an invite_links row) or rejects it.
class InviteRequest(Base):
    __tablename__ = "invite_requests"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    # E.164, e.g. +393331234567 (services/phone_service.py).
    phone = Column(String(30), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    invite_link_id = Column(Integer, ForeignKey("invite_links.id"), nullable=True)
    created_at = Column(DateTime, nullable=False)
    decided_at = Column(DateTime, nullable=True)

    invite_link = relationship("InviteLink")
```

In `models/invite_link_model.py` add after `created_at`:
```python
    # When the admin opened the WhatsApp send for this invite (admin "Inviti" page).
    sent_at = Column(DateTime, nullable=True)
```

- [ ] **Step 2: Write the migration**

`alembic/versions/20261001_0014_invite_requests.py`:
```python
"""Adds invite_requests (guests asking for their invite from the site) and
invite_links.sent_at (when the admin sent the invite on WhatsApp).

Revision ID: 20261001_0014
Revises: 20260910_0013
Create Date: 2026-10-01 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261001_0014"
down_revision: Union[str, Sequence[str], None] = "20260910_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "invite_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("first_name", sa.String(length=80), nullable=False),
        sa.Column("last_name", sa.String(length=80), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("invite_link_id", sa.Integer(), sa.ForeignKey("invite_links.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("decided_at", sa.DateTime(), nullable=True),
    )
    op.create_index(op.f("ix_invite_requests_id"), "invite_requests", ["id"])
    op.create_index(op.f("ix_invite_requests_phone"), "invite_requests", ["phone"])
    op.create_index(op.f("ix_invite_requests_status"), "invite_requests", ["status"])
    op.add_column("invite_links", sa.Column("sent_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("invite_links", "sent_at")
    op.drop_index(op.f("ix_invite_requests_status"), table_name="invite_requests")
    op.drop_index(op.f("ix_invite_requests_phone"), table_name="invite_requests")
    op.drop_index(op.f("ix_invite_requests_id"), table_name="invite_requests")
    op.drop_table("invite_requests")
```

- [ ] **Step 3: Settings**

Append to `settings.py`:
```python
def read_site_url() -> str:
    """Public site origin used to build invite links (e.g. https://aot-wedding.it)."""
    return os.getenv("SITE_URL", "http://localhost:5173").strip().rstrip("/")


def read_telegram_bot_token() -> str:
    """Bot token for new-invite-request notifications; empty disables them."""
    return os.getenv("TELEGRAM_BOT_TOKEN", "").strip()


def read_telegram_chat_id() -> str:
    """Chat that receives the notifications; empty disables them."""
    return os.getenv("TELEGRAM_CHAT_ID", "").strip()
```

Append to `env.example`:
```
# Public site origin for invite links sent on WhatsApp
SITE_URL=http://localhost:5173
# Telegram bot that pings the couple on new invite requests (leave empty to disable)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

- [ ] **Step 4: Test truncation**

In `tests/conftest.py` `truncate_test_tables`, add `invite_requests,` as the first table in the `TRUNCATE TABLE` list (before `invite_links`).

- [ ] **Step 5: Run the suite to verify the migration applies**

Run: `./venv/bin/pytest -q`
Expected: all existing tests PASS (the session fixture rebuilds the schema through migration 0014).

- [ ] **Step 6: Commit**

```bash
git add models/invite_request_model.py models/invite_link_model.py alembic/versions/20261001_0014_invite_requests.py settings.py env.example tests/conftest.py
git commit -m "feat(invites): add invite_requests table and invite_links.sent_at"
```

---

### Task 2: Phone normalisation

**Files:**
- Create: `services/phone_service.py`
- Test: `tests/test_phone_service.py`

**Interfaces:**
- Produces: `normalize_phone(raw: str) -> str` (E.164), `InvalidPhoneError(ValueError)`.

- [ ] **Step 1: Write the failing test**

`tests/test_phone_service.py`:
```python
import pytest

from services.phone_service import InvalidPhoneError, normalize_phone


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("+39 333 123 4567", "+393331234567"),
        ("333 1234567", "+393331234567"),
        ("0039 333 1234567", "+393331234567"),
        ("+39 (333) 123-4567", "+393331234567"),
        ("+33 6 12 34 56 78", "+33612345678"),
    ],
)
def test_normalizes_to_e164(raw, expected):
    assert normalize_phone(raw) == expected


@pytest.mark.parametrize("raw", ["", "+39", "+39 12", "333 abc 4567", "+39 3331234567890123"])
def test_rejects_invalid_numbers(raw):
    with pytest.raises(InvalidPhoneError):
        normalize_phone(raw)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_phone_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.phone_service'`

- [ ] **Step 3: Implement**

`services/phone_service.py`:
```python
import re

DEFAULT_COUNTRY_CODE = "39"
_ALLOWED = re.compile(r"^\+?[0-9\s().-]+$")


class InvalidPhoneError(ValueError):
    pass


def normalize_phone(raw: str) -> str:
    """Turns a guest-typed phone into E.164 (+393331234567); Italy is assumed
    when no international prefix is given. 8-15 digits, per E.164."""
    value = (raw or "").strip()
    if not value or not _ALLOWED.match(value):
        raise InvalidPhoneError("Invalid phone number.")

    digits = re.sub(r"\D", "", value)
    if value.startswith("+"):
        pass
    elif digits.startswith("00"):
        digits = digits[2:]
    else:
        digits = DEFAULT_COUNTRY_CODE + digits

    if not 8 <= len(digits) <= 15:
        raise InvalidPhoneError("Invalid phone number.")
    return f"+{digits}"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest tests/test_phone_service.py -v`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add services/phone_service.py tests/test_phone_service.py
git commit -m "feat(invites): normalise guest phone numbers to E.164"
```

---

### Task 3: Sliding-window rate limiter

**Files:**
- Create: `services/rate_limit_service.py`
- Test: `tests/test_rate_limit_service.py`

**Interfaces:**
- Produces: `SlidingWindowLimiter(limit: int, window_seconds: int)` with `.hit(key: str, now: float | None = None) -> bool` (True = allowed, records the hit) and `.reset() -> None`.

- [ ] **Step 1: Write the failing test**

`tests/test_rate_limit_service.py`:
```python
from services.rate_limit_service import SlidingWindowLimiter


def test_allows_up_to_limit_then_blocks():
    limiter = SlidingWindowLimiter(limit=3, window_seconds=3600)
    assert [limiter.hit("a", now=0) for _ in range(4)] == [True, True, True, False]


def test_keys_are_independent():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=3600)
    assert limiter.hit("a", now=0)
    assert limiter.hit("b", now=0)
    assert not limiter.hit("a", now=1)


def test_window_slides():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=60)
    assert limiter.hit("a", now=0)
    assert not limiter.hit("a", now=59)
    assert limiter.hit("a", now=61)


def test_reset_clears_everything():
    limiter = SlidingWindowLimiter(limit=1, window_seconds=60)
    limiter.hit("a", now=0)
    limiter.reset()
    assert limiter.hit("a", now=1)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_rate_limit_service.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement**

`services/rate_limit_service.py`:
```python
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Optional


class SlidingWindowLimiter:
    """At most `limit` hits per key in any `window_seconds` span.

    ponytail: in-process memory — counts reset on restart and are per worker;
    fine for a wedding's traffic, move to Redis/DB if it ever runs multi-instance.
    """

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def hit(self, key: str, now: Optional[float] = None) -> bool:
        current = time.monotonic() if now is None else now
        with self._lock:
            hits = self._hits[key]
            while hits and current - hits[0] >= self.window_seconds:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(current)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest tests/test_rate_limit_service.py -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add services/rate_limit_service.py tests/test_rate_limit_service.py
git commit -m "feat(invites): add in-memory sliding-window rate limiter"
```

---

### Task 4: Invite token, invite URL and WhatsApp link

**Files:**
- Modify: `services/invite_link_service.py`, `scripts/generate_invite_links.py`
- Create: `services/invite_message_service.py`
- Test: `tests/test_invite_message_service.py`

**Interfaces:**
- Produces: `generate_unique_token(db: Session) -> str`, `build_invite_url(token: str) -> str` (in `invite_link_service`); `INVITE_MESSAGE_TEMPLATE: str`, `build_whatsapp_url(phone: str | None, first_name: str, invite_url: str) -> str` (in `invite_message_service`).

- [ ] **Step 1: Write the failing test**

`tests/test_invite_message_service.py`:
```python
from urllib.parse import parse_qs, urlparse

from services.invite_link_service import build_invite_url
from services.invite_message_service import build_whatsapp_url


def test_invite_url_uses_site_url(monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://aot-wedding.it/")
    assert build_invite_url("tok123") == "https://aot-wedding.it/invito/tok123"


def test_whatsapp_url_targets_phone_with_prefilled_message():
    url = build_whatsapp_url("+393331234567", "Mario", "https://site/invito/tok")
    parsed = urlparse(url)
    assert parsed.netloc == "wa.me"
    assert parsed.path == "/393331234567"
    assert parse_qs(parsed.query)["text"] == [
        "Ciao Mario! Davide e Ilaria ti aspettano il 31 maggio 2027 🕊️ "
        "Ecco il tuo invito personale: https://site/invito/tok"
    ]


def test_whatsapp_url_without_phone_lets_admin_pick_contact():
    url = build_whatsapp_url(None, "Mario", "https://site/invito/tok")
    assert url.startswith("https://wa.me/?text=")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_invite_message_service.py -v`
Expected: FAIL with `ImportError: cannot import name 'build_invite_url'`

- [ ] **Step 3: Implement**

Append to `services/invite_link_service.py` (add `import secrets` and `from settings import read_site_url` at the top):
```python
TOKEN_BYTES = 12  # secrets.token_urlsafe(12) -> 16 chars, 96 bits of entropy


# Shared by the CLI import script and admin approval of invite requests.
def generate_unique_token(db: Session) -> str:
    for _ in range(5):
        token = secrets.token_urlsafe(TOKEN_BYTES)
        if not db.query(InviteLink).filter(InviteLink.token == token).first():
            return token
    raise RuntimeError("Could not generate a unique token after 5 attempts.")


def build_invite_url(token: str) -> str:
    return f"{read_site_url()}/invito/{token}"
```

In `scripts/generate_invite_links.py`: delete its local `TOKEN_BYTES` constant and `generate_unique_token` function, and add `from services.invite_link_service import generate_unique_token  # noqa: E402` next to the other `noqa: E402` imports. Leave `import secrets` only if still used elsewhere in the script (it is not — remove it).

`services/invite_message_service.py`:
```python
from typing import Optional
from urllib.parse import quote

INVITE_MESSAGE_TEMPLATE = (
    "Ciao {first_name}! Davide e Ilaria ti aspettano il 31 maggio 2027 🕊️ "
    "Ecco il tuo invito personale: {invite_url}"
)


def build_whatsapp_url(phone: Optional[str], first_name: str, invite_url: str) -> str:
    """wa.me link that opens WhatsApp with the invite message ready to send.
    Without a phone, WhatsApp lets the admin pick the contact."""
    message = INVITE_MESSAGE_TEMPLATE.format(first_name=first_name, invite_url=invite_url)
    target = (phone or "").lstrip("+")
    return f"https://wa.me/{target}?text={quote(message)}"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `./venv/bin/pytest tests/test_invite_message_service.py -v && ./venv/bin/python -c "import scripts.generate_invite_links"`
Expected: PASS (3 tests); the import prints nothing and exits 0.

- [ ] **Step 5: Commit**

```bash
git add services/invite_link_service.py services/invite_message_service.py scripts/generate_invite_links.py tests/test_invite_message_service.py
git commit -m "feat(invites): build invite URLs and one-tap WhatsApp links"
```

---

### Task 5: Telegram notifier

**Files:**
- Create: `services/telegram_notify_service.py`
- Test: `tests/test_telegram_notify_service.py`

**Interfaces:**
- Produces: `notify_new_invite_request(first_name: str, last_name: str, phone: str) -> None` — never raises.

- [ ] **Step 1: Write the failing test**

`tests/test_telegram_notify_service.py`:
```python
import httpx

from services import telegram_notify_service


def test_skips_when_not_configured(monkeypatch):
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("TELEGRAM_CHAT_ID", raising=False)
    calls = []
    monkeypatch.setattr(telegram_notify_service.httpx, "post", lambda *a, **k: calls.append(a))
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")
    assert calls == []


def test_posts_message_to_configured_chat(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")
    monkeypatch.setenv("SITE_URL", "https://site")
    sent = {}

    def fake_post(url, json, timeout):
        sent.update(url=url, json=json, timeout=timeout)
        return httpx.Response(200, request=httpx.Request("POST", url))

    monkeypatch.setattr(telegram_notify_service.httpx, "post", fake_post)
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")

    assert sent["url"] == "https://api.telegram.org/botbot-token/sendMessage"
    assert sent["json"]["chat_id"] == "42"
    assert "Mario Rossi" in sent["json"]["text"]
    assert "+393331234567" in sent["json"]["text"]
    assert "https://site/admin/invites" in sent["json"]["text"]
    assert sent["timeout"] == 3


def test_swallows_network_errors(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "bot-token")
    monkeypatch.setenv("TELEGRAM_CHAT_ID", "42")

    def boom(*args, **kwargs):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(telegram_notify_service.httpx, "post", boom)
    telegram_notify_service.notify_new_invite_request("Mario", "Rossi", "+393331234567")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_telegram_notify_service.py -v`
Expected: FAIL with `ImportError`

- [ ] **Step 3: Implement**

`services/telegram_notify_service.py`:
```python
import logging

import httpx

from settings import read_site_url, read_telegram_bot_token, read_telegram_chat_id

logger = logging.getLogger(__name__)
TIMEOUT_SECONDS = 3


def notify_new_invite_request(first_name: str, last_name: str, phone: str) -> None:
    """Pings the couple's Telegram chat about a new request. Runs as a
    background task; any failure is logged, never raised — the request is
    already saved and the admin badge still shows it."""
    token = read_telegram_bot_token()
    chat_id = read_telegram_chat_id()
    if not token or not chat_id:
        logger.info("Telegram not configured; skipping invite request notification.")
        return

    text = (
        f"📬 Nuova richiesta invito: {first_name} {last_name} · {phone}\n"
        f"{read_site_url()}/admin/invites"
    )
    try:
        response = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text},
            timeout=TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        logger.warning("Telegram notification failed: %s", error)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./venv/bin/pytest tests/test_telegram_notify_service.py -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add services/telegram_notify_service.py tests/test_telegram_notify_service.py
git commit -m "feat(invites): notify the couple on Telegram about new requests"
```

---

### Task 6: Public `POST /invite-requests`

**Files:**
- Create: `schemas/invite_request_schema.py`, `services/invite_request_service.py`, `routes/invite_request_route.py`
- Modify: `main.py`
- Test: `tests/test_invite_requests_api.py`

**Interfaces:**
- Consumes: `normalize_phone`, `InvalidPhoneError` (Task 2); `SlidingWindowLimiter` (Task 3); `notify_new_invite_request` (Task 5); `InviteRequest` (Task 1).
- Produces: `InviteRequestCreate` schema (`first_name`, `last_name`, `phone`, `website`); `create_invite_request(db, first_name, last_name, phone_e164) -> InviteRequest`; module-level `phone_limiter`, `ip_limiter` in `routes/invite_request_route.py` (tests reset them).

- [ ] **Step 1: Write the failing test**

`tests/test_invite_requests_api.py`:
```python
from datetime import datetime

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.invite_request_model import InviteRequest
from routes import invite_request_route

ACCEPTED_BODY = {"status": "received"}


@pytest.fixture(autouse=True)
def no_telegram_and_fresh_limits(monkeypatch):
    sent = []
    monkeypatch.setattr(invite_request_route, "notify_new_invite_request", lambda *a: sent.append(a))
    invite_request_route.phone_limiter.reset()
    invite_request_route.ip_limiter.reset()
    return sent


def _payload(**overrides):
    return {"first_name": "Mario", "last_name": "Rossi", "phone": "333 1234567", "website": "", **overrides}


def _requests():
    db = SessionLocal()
    rows = db.query(InviteRequest).all()
    db.close()
    return rows


def test_saves_pending_request_with_normalised_phone(api_client, no_telegram_and_fresh_limits):
    response = api_client.post("/invite-requests", json=_payload())
    assert response.status_code == 202
    assert response.json() == ACCEPTED_BODY
    [row] = _requests()
    assert (row.first_name, row.last_name, row.phone, row.status) == ("Mario", "Rossi", "+393331234567", "pending")
    assert no_telegram_and_fresh_limits == [("Mario", "Rossi", "+393331234567")]


def test_same_answer_when_phone_already_has_invite(api_client):
    db = SessionLocal()
    db.add(InviteLink(token="t1", first_name="Mario", last_name="Rossi", phone="+393331234567", created_at=datetime.utcnow()))
    db.commit()
    db.close()
    response = api_client.post("/invite-requests", json=_payload())
    assert response.status_code == 202
    assert response.json() == ACCEPTED_BODY


def test_honeypot_is_accepted_but_not_saved(api_client, no_telegram_and_fresh_limits):
    response = api_client.post("/invite-requests", json=_payload(website="http://spam"))
    assert response.status_code == 202
    assert response.json() == ACCEPTED_BODY
    assert _requests() == []
    assert no_telegram_and_fresh_limits == []


def test_invalid_phone_is_422(api_client):
    response = api_client.post("/invite-requests", json=_payload(phone="12"))
    assert response.status_code == 422


def test_blank_names_are_422(api_client):
    response = api_client.post("/invite-requests", json=_payload(first_name="  "))
    assert response.status_code == 422


def test_fourth_request_for_same_phone_in_an_hour_is_429(api_client):
    statuses = [api_client.post("/invite-requests", json=_payload()).status_code for _ in range(4)]
    assert statuses == [202, 202, 202, 429]


def test_eleventh_request_from_same_ip_in_an_hour_is_429(api_client):
    statuses = [
        api_client.post("/invite-requests", json=_payload(phone=f"333 12345{n:02d}")).status_code
        for n in range(11)
    ]
    assert statuses[:10] == [202] * 10
    assert statuses[10] == 429
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_invite_requests_api.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'models.invite_request_model'`… if Task 1 is done, then `ImportError: cannot import name 'invite_request_route'`

- [ ] **Step 3: Schemas**

`schemas/invite_request_schema.py`:
```python
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator

InviteRequestStatus = Literal["pending", "approved", "rejected"]


class InviteRequestCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    # Honeypot: real guests never see this field; anything here means a bot.
    website: str = ""

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Required.")
        if len(value) > 80:
            raise ValueError("Too long.")
        return value


class InviteRequestAccepted(BaseModel):
    status: Literal["received"] = "received"


class ExistingInviteSummary(BaseModel):
    id: int
    first_name: str
    last_name: str


class InviteRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    phone: str
    status: InviteRequestStatus
    created_at: datetime
    decided_at: Optional[datetime] = None
    invite_link_id: Optional[int] = None
    existing_invite: Optional[ExistingInviteSummary] = None


class PendingCountResponse(BaseModel):
    pending: int


class ApproveInviteRequestResponse(BaseModel):
    invite_link_id: int
    invite_url: str
    whatsapp_url: str


InviteAnswer = Literal["none", "attending", "declined"]


class AdminInviteResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    sent_at: Optional[datetime] = None
    answer: InviteAnswer
    invite_url: str
    whatsapp_url: str
```

- [ ] **Step 4: Service (create only for now)**

`services/invite_request_service.py`:
```python
from datetime import datetime

from sqlalchemy.orm import Session

from models.invite_request_model import InviteRequest


def create_invite_request(db: Session, first_name: str, last_name: str, phone_e164: str) -> InviteRequest:
    request = InviteRequest(
        first_name=first_name,
        last_name=last_name,
        phone=phone_e164,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request
```

- [ ] **Step 5: Route**

`routes/invite_request_route.py`:
```python
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.invite_request_schema import InviteRequestAccepted, InviteRequestCreate
from services.invite_request_service import create_invite_request
from services.phone_service import InvalidPhoneError, normalize_phone
from services.rate_limit_service import SlidingWindowLimiter
from services.telegram_notify_service import notify_new_invite_request

router = APIRouter(prefix="/invite-requests")

HOUR = 3600
phone_limiter = SlidingWindowLimiter(limit=3, window_seconds=HOUR)
ip_limiter = SlidingWindowLimiter(limit=10, window_seconds=HOUR)


def _client_ip(request: Request) -> str:
    # Behind Render/Vercel the real client is the first X-Forwarded-For entry.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Public: a guest without their WhatsApp link asks the couple for it. The
# answer is identical whether or not the phone already has an invite, so the
# site never reveals who is on the guest list.
@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=InviteRequestAccepted)
def request_invite(
    payload: InviteRequestCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if payload.website.strip():
        return InviteRequestAccepted()

    try:
        phone = normalize_phone(payload.phone)
    except InvalidPhoneError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    if not ip_limiter.hit(_client_ip(request)) or not phone_limiter.hit(phone):
        raise HTTPException(status_code=429, detail="Too many requests, try again later.")

    create_invite_request(db, payload.first_name, payload.last_name, phone)
    background_tasks.add_task(notify_new_invite_request, payload.first_name, payload.last_name, phone)
    return InviteRequestAccepted()
```

In `main.py` add `from routes.invite_request_route import router as invite_request_router` with the other route imports and `app.include_router(invite_request_router)` after `app.include_router(guest_rsvp_router)`.

- [ ] **Step 6: Run test to verify it passes**

Run: `./venv/bin/pytest tests/test_invite_requests_api.py -v`
Expected: PASS (7 tests)

- [ ] **Step 7: Commit**

```bash
git add schemas/invite_request_schema.py services/invite_request_service.py routes/invite_request_route.py main.py tests/test_invite_requests_api.py
git commit -m "feat(invites): public endpoint for guests to request their invite"
```

---

### Task 7: Admin — list, count, approve, reject requests

**Files:**
- Modify: `services/invite_request_service.py`
- Create: `routes/admin_invite_route.py`
- Modify: `main.py`
- Test: `tests/test_admin_invites_api.py`

**Interfaces:**
- Consumes: `generate_unique_token`, `build_invite_url` (Task 4); `build_whatsapp_url` (Task 4); schemas from Task 6.
- Produces: `list_invite_requests(db, status: str | None) -> list[InviteRequestResponse]`, `count_pending_requests(db) -> int`, `approve_invite_request(db, request_id: int) -> ApproveInviteRequestResponse`, `reject_invite_request(db, request_id: int) -> InviteRequestResponse`, `InviteRequestNotFoundError`; `router` with prefix `/admin` in `routes/admin_invite_route.py` (Task 8 adds to it).

- [ ] **Step 1: Write the failing test**

`tests/test_admin_invites_api.py`:
```python
from datetime import datetime
from urllib.parse import parse_qs, urlparse

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.invite_request_model import InviteRequest


def _add_request(first_name="Mario", phone="+393331234567", status="pending"):
    db = SessionLocal()
    row = InviteRequest(first_name=first_name, last_name="Rossi", phone=phone, status=status, created_at=datetime.utcnow())
    db.add(row)
    db.commit()
    db.refresh(row)
    db.close()
    return row.id


def _add_invite(token="tok-existing", phone="+393331234567", first_name="Mario"):
    db = SessionLocal()
    row = InviteLink(token=token, first_name=first_name, last_name="Rossi", phone=phone, created_at=datetime.utcnow())
    db.add(row)
    db.commit()
    db.refresh(row)
    db.close()
    return row.id


def test_requires_admin(api_client, user_headers):
    assert api_client.get("/admin/invite-requests").status_code == 403


def test_lists_pending_requests_with_existing_invite_hint(api_client, admin_headers):
    _add_request()
    _add_request(first_name="Luca", phone="+393339999999", status="rejected")
    invite_id = _add_invite()

    response = api_client.get("/admin/invite-requests?status=pending")
    assert response.status_code == 200
    [row] = response.json()
    assert row["first_name"] == "Mario"
    assert row["existing_invite"]["id"] == invite_id


def test_pending_count(api_client, admin_headers):
    _add_request()
    _add_request(phone="+393330000000")
    _add_request(phone="+393331111111", status="approved")
    assert api_client.get("/admin/invite-requests/pending-count").json() == {"pending": 2}


def test_approve_creates_invite_and_returns_whatsapp_link(api_client, admin_headers, monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://site")
    request_id = _add_request()

    response = api_client.post(f"/admin/invite-requests/{request_id}/approve")
    assert response.status_code == 200
    body = response.json()
    assert body["invite_url"].startswith("https://site/invito/")
    parsed = urlparse(body["whatsapp_url"])
    assert parsed.path == "/393331234567"
    assert body["invite_url"] in parse_qs(parsed.query)["text"][0]

    db = SessionLocal()
    request = db.query(InviteRequest).get(request_id)
    invite = db.query(InviteLink).get(body["invite_link_id"])
    db.close()
    assert request.status == "approved" and request.invite_link_id == invite.id and request.decided_at
    assert (invite.first_name, invite.phone) == ("Mario", "+393331234567")


def test_approve_reuses_existing_invite_for_same_phone(api_client, admin_headers):
    invite_id = _add_invite()
    request_id = _add_request()
    body = api_client.post(f"/admin/invite-requests/{request_id}/approve").json()
    assert body["invite_link_id"] == invite_id
    db = SessionLocal()
    assert db.query(InviteLink).count() == 1
    db.close()


def test_reject_marks_request(api_client, admin_headers):
    request_id = _add_request()
    response = api_client.post(f"/admin/invite-requests/{request_id}/reject")
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_unknown_request_is_404(api_client, admin_headers):
    assert api_client.post("/admin/invite-requests/999/approve").status_code == 404
    assert api_client.post("/admin/invite-requests/999/reject").status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_admin_invites_api.py -v`
Expected: FAIL — `/admin/invite-requests` returns 404 (router not registered).

- [ ] **Step 3: Service functions**

Append to `services/invite_request_service.py` (merge the imports at the top of the file):
```python
from typing import Optional

from models.invite_link_model import InviteLink
from schemas.invite_request_schema import (
    ApproveInviteRequestResponse,
    ExistingInviteSummary,
    InviteRequestResponse,
)
from services.invite_link_service import build_invite_url, generate_unique_token
from services.invite_message_service import build_whatsapp_url


class InviteRequestNotFoundError(Exception):
    pass


def _invite_for_phone(db: Session, phone: str) -> Optional[InviteLink]:
    return db.query(InviteLink).filter(InviteLink.phone == phone).order_by(InviteLink.id).first()


def _to_response(db: Session, request: InviteRequest) -> InviteRequestResponse:
    response = InviteRequestResponse.model_validate(request)
    existing = _invite_for_phone(db, request.phone)
    if existing:
        response.existing_invite = ExistingInviteSummary(
            id=existing.id, first_name=existing.first_name, last_name=existing.last_name
        )
    return response


def _get_request(db: Session, request_id: int) -> InviteRequest:
    request = db.query(InviteRequest).filter(InviteRequest.id == request_id).first()
    if not request:
        raise InviteRequestNotFoundError("Invite request not found")
    return request


def list_invite_requests(db: Session, status: Optional[str]) -> list[InviteRequestResponse]:
    query = db.query(InviteRequest)
    if status:
        query = query.filter(InviteRequest.status == status)
    return [_to_response(db, row) for row in query.order_by(InviteRequest.created_at.desc()).all()]


def count_pending_requests(db: Session) -> int:
    return db.query(InviteRequest).filter(InviteRequest.status == "pending").count()


# Reuses the invite already tied to this phone (a guest who lost the link
# gets the same one back); otherwise creates a fresh invite for them.
def approve_invite_request(db: Session, request_id: int) -> ApproveInviteRequestResponse:
    request = _get_request(db, request_id)
    invite = _invite_for_phone(db, request.phone)
    if not invite:
        invite = InviteLink(
            token=generate_unique_token(db),
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            created_at=datetime.utcnow(),
        )
        db.add(invite)
        db.flush()

    request.status = "approved"
    request.invite_link_id = invite.id
    request.decided_at = datetime.utcnow()
    db.commit()

    invite_url = build_invite_url(invite.token)
    return ApproveInviteRequestResponse(
        invite_link_id=invite.id,
        invite_url=invite_url,
        whatsapp_url=build_whatsapp_url(invite.phone, invite.first_name, invite_url),
    )


def reject_invite_request(db: Session, request_id: int) -> InviteRequestResponse:
    request = _get_request(db, request_id)
    request.status = "rejected"
    request.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return _to_response(db, request)
```

- [ ] **Step 4: Admin route**

`routes/admin_invite_route.py`:
```python
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.invite_request_schema import (
    ApproveInviteRequestResponse,
    InviteRequestResponse,
    PendingCountResponse,
)
from services.invite_request_service import (
    InviteRequestNotFoundError,
    approve_invite_request,
    count_pending_requests,
    list_invite_requests,
    reject_invite_request,
)

router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin_user)])


@router.get("/invite-requests", response_model=list[InviteRequestResponse])
def list_requests(
    status: Optional[Literal["pending", "approved", "rejected"]] = None,
    db: Session = Depends(get_db),
):
    return list_invite_requests(db, status)


# Feeds the badge on the admin "Inviti" menu entry.
@router.get("/invite-requests/pending-count", response_model=PendingCountResponse)
def pending_count(db: Session = Depends(get_db)):
    return PendingCountResponse(pending=count_pending_requests(db))


@router.post("/invite-requests/{request_id}/approve", response_model=ApproveInviteRequestResponse)
def approve_request(request_id: int, db: Session = Depends(get_db)):
    try:
        return approve_invite_request(db, request_id)
    except InviteRequestNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/invite-requests/{request_id}/reject", response_model=InviteRequestResponse)
def reject_request(request_id: int, db: Session = Depends(get_db)):
    try:
        return reject_invite_request(db, request_id)
    except InviteRequestNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
```

In `main.py`: `from routes.admin_invite_route import router as admin_invite_router` and `app.include_router(admin_invite_router)`.

- [ ] **Step 5: Run test to verify it passes**

Run: `./venv/bin/pytest tests/test_admin_invites_api.py -v`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add services/invite_request_service.py routes/admin_invite_route.py main.py tests/test_admin_invites_api.py
git commit -m "feat(admin): list, count, approve and reject invite requests"
```

---

### Task 8: Admin — all invites and mark-sent

**Files:**
- Modify: `services/invite_request_service.py`, `routes/admin_invite_route.py`
- Test: `tests/test_admin_invites_api.py` (append)

**Interfaces:**
- Consumes: Task 7 router and helpers; `RSVP` model (`models/rsvp_model.py`, has `user_id`, `attending`).
- Produces: `list_admin_invites(db, filter: str | None, search: str | None) -> list[AdminInviteResponse]`, `mark_invite_sent(db, invite_id: int) -> AdminInviteResponse`, `InviteNotFoundError`.

- [ ] **Step 1: Write the failing test**

Append to `tests/test_admin_invites_api.py`:
```python
from models.rsvp_model import RSVP
from models.user_model import User


def _answer(invite_id, attending):
    db = SessionLocal()
    user = User(first_name="Mario", last_name="Rossi", email=None, password_hash=None, role="user", created_at=datetime.utcnow())
    db.add(user)
    db.flush()
    db.query(InviteLink).filter(InviteLink.id == invite_id).update({"user_id": user.id})
    db.add(RSVP(user_id=user.id, attending=attending, faction=None))
    db.commit()
    db.close()


def test_lists_invites_with_status_and_whatsapp_link(api_client, admin_headers):
    invite_id = _add_invite()
    [row] = api_client.get("/admin/invites").json()
    assert row["id"] == invite_id
    assert row["answer"] == "none"
    assert row["sent_at"] is None
    assert row["whatsapp_url"].startswith("https://wa.me/393331234567?text=")


def test_filters_and_search(api_client, admin_headers):
    to_send = _add_invite(token="a", phone="+393330000001", first_name="Anna")
    sent = _add_invite(token="b", phone="+393330000002", first_name="Bruno")
    answered = _add_invite(token="c", phone="+393330000003", first_name="Carla")
    api_client.post(f"/admin/invites/{sent}/mark-sent")
    _answer(answered, attending=True)

    ids = lambda q: [row["id"] for row in api_client.get(f"/admin/invites{q}").json()]
    assert ids("?filter=to_send") == [to_send, answered]
    assert ids("?filter=sent") == [sent]
    assert ids("?filter=answered") == [answered]
    assert ids("?search=brun") == [sent]
    assert ids("?search=0000003") == [answered]


def test_answer_reflects_declined(api_client, admin_headers):
    invite_id = _add_invite()
    _answer(invite_id, attending=False)
    assert api_client.get("/admin/invites").json()[0]["answer"] == "declined"


def test_mark_sent_sets_timestamp(api_client, admin_headers):
    invite_id = _add_invite()
    response = api_client.post(f"/admin/invites/{invite_id}/mark-sent")
    assert response.status_code == 200
    assert response.json()["sent_at"] is not None
    assert api_client.post("/admin/invites/999/mark-sent").status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_admin_invites_api.py -v`
Expected: the 4 new tests FAIL with 404 on `/admin/invites`.

- [ ] **Step 3: Service functions**

Append to `services/invite_request_service.py` (add `from sqlalchemy import or_` and `from models.rsvp_model import RSVP`, and `AdminInviteResponse` to the schema imports):
```python
class InviteNotFoundError(Exception):
    pass


def _answer_for(db: Session, invite: InviteLink) -> str:
    if not invite.user_id:
        return "none"
    rsvp = db.query(RSVP).filter(RSVP.user_id == invite.user_id).first()
    if not rsvp:
        return "none"
    return "attending" if rsvp.attending else "declined"


def _to_admin_invite(db: Session, invite: InviteLink) -> AdminInviteResponse:
    invite_url = build_invite_url(invite.token)
    return AdminInviteResponse(
        id=invite.id,
        first_name=invite.first_name,
        last_name=invite.last_name,
        phone=invite.phone,
        sent_at=invite.sent_at,
        answer=_answer_for(db, invite),
        invite_url=invite_url,
        whatsapp_url=build_whatsapp_url(invite.phone, invite.first_name, invite_url),
    )


def list_admin_invites(db: Session, filter: Optional[str], search: Optional[str]) -> list[AdminInviteResponse]:
    query = db.query(InviteLink)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(InviteLink.first_name.ilike(pattern), InviteLink.last_name.ilike(pattern), InviteLink.phone.ilike(pattern))
        )
    invites = [_to_admin_invite(db, invite) for invite in query.order_by(InviteLink.id).all()]
    if filter == "to_send":
        return [invite for invite in invites if invite.sent_at is None]
    if filter == "sent":
        return [invite for invite in invites if invite.sent_at is not None]
    if filter == "answered":
        return [invite for invite in invites if invite.answer != "none"]
    return invites


def mark_invite_sent(db: Session, invite_id: int) -> AdminInviteResponse:
    invite = db.query(InviteLink).filter(InviteLink.id == invite_id).first()
    if not invite:
        raise InviteNotFoundError("Invite not found")
    invite.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(invite)
    return _to_admin_invite(db, invite)
```

Note: `_answer_for` runs one query per invite — fine for a wedding guest list (tens to low hundreds of rows); mark it `# ponytail: N+1 per invite, join RSVP if the list ever grows large`.

- [ ] **Step 4: Routes**

Append to `routes/admin_invite_route.py` (add `AdminInviteResponse` to the schema import and `InviteNotFoundError, list_admin_invites, mark_invite_sent` to the service import):
```python
@router.get("/invites", response_model=list[AdminInviteResponse])
def list_invites(
    filter: Optional[Literal["to_send", "sent", "answered"]] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return list_admin_invites(db, filter, search)


# Called by the admin page right after it opens the wa.me link.
@router.post("/invites/{invite_id}/mark-sent", response_model=AdminInviteResponse)
def mark_sent(invite_id: int, db: Session = Depends(get_db)):
    try:
        return mark_invite_sent(db, invite_id)
    except InviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
```

- [ ] **Step 5: Run test to verify it passes**

Run: `./venv/bin/pytest tests/test_admin_invites_api.py -v`
Expected: PASS (11 tests)

- [ ] **Step 6: Commit**

```bash
git add services/invite_request_service.py routes/admin_invite_route.py tests/test_admin_invites_api.py
git commit -m "feat(admin): list every invite with send/answer status and mark sent"
```

---

### Task 9: `GET /invites/{token}/rsvp` for prefill on return

**Files:**
- Modify: `routes/invite_link_route.py`
- Test: `tests/test_guest_rsvp_api.py` (append)

**Interfaces:**
- Consumes: `get_invite_by_token` (existing), `get_rsvp_for_user(db, user) -> RsvpMeResponse` (existing in `services/rsvp_service.py`).
- Produces: `GET /invites/{token}/rsvp` → `RsvpMeResponse | null`; 404 for an unknown token.

- [ ] **Step 1: Write the failing test**

Append to `tests/test_guest_rsvp_api.py` (uses the file's existing `invite_token` fixture and `_guest_line` helper):
```python
def test_invite_rsvp_is_null_before_first_answer(api_client, invite_token):
    response = api_client.get(f"/invites/{invite_token}/rsvp")
    assert response.status_code == 200
    assert response.json() is None


def test_invite_rsvp_returns_saved_answer(api_client, invite_token):
    payload = {"attending": True, "guests": [_guest_line(), _guest_line("Anna", "Rossi")]}
    assert api_client.post(f"/invites/{invite_token}/rsvp", json=payload).status_code == 200
    api_client.cookies.clear()  # the token alone must be enough, no session

    body = api_client.get(f"/invites/{invite_token}/rsvp").json()
    assert body["attending"] is True
    assert [guest["first_name"] for guest in body["guests"]] == ["Mario", "Anna"]
    assert "phone" not in body


def test_invite_rsvp_unknown_token_is_404(api_client):
    assert api_client.get("/invites/nope/rsvp").status_code == 404
```

Before writing, confirm the RSVP POST payload shape against an existing passing test in the same file and match it exactly (field names of `RSVPSubmitRequest` in `schemas/rsvp_confirmation_schema.py`).

- [ ] **Step 2: Run test to verify it fails**

Run: `./venv/bin/pytest tests/test_guest_rsvp_api.py -v -k invite_rsvp`
Expected: FAIL — `GET /invites/{token}/rsvp` returns 405 (only POST exists on that path).

- [ ] **Step 3: Implement**

Append to `routes/invite_link_route.py` (add `from typing import Optional`, `from schemas.rsvp_lookup_schema import RsvpMeResponse`, `from services.rsvp_service import get_rsvp_for_user`):
```python
# The guest's answer so far, so reopening the WhatsApp link shows a filled-in
# form. The token is the only credential, as for GET /invites/{token}; null
# until the guest answers for the first time.
@router.get("/{token}/rsvp", response_model=Optional[RsvpMeResponse])
def read_invite_rsvp(token: str, db: Session = Depends(get_db)):
    invite = get_invite_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if not invite.user:
        return None
    return get_rsvp_for_user(db, invite.user)
```

- [ ] **Step 4: Run the whole backend suite**

Run: `./venv/bin/pytest -q`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add routes/invite_link_route.py tests/test_guest_rsvp_api.py
git commit -m "feat(invites): read a guest's saved RSVP from their invite token"
```

---

## Follow-up plans (not in this one)

1. Frontend admin "Inviti" page + badge (consumes Tasks 7-8).
2. Frontend invite page prefill (consumes Task 9).
3. Faction removal (backend enum/service/column + admin stats, frontend constants/summary/i18n).
4. Telegram setup walkthrough for the couple (BotFather, chat id) — docs only.
