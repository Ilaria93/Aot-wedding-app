from __future__ import annotations

from datetime import datetime, timedelta
import re

import pytest

from database.base import SessionLocal
from models.guest_magic_link_model import GuestMagicLink
from models.invite_link_model import InviteLink
from models.user_model import User
from schemas.guest_access_schema import GuestRsvpConfirmRequest
from services.guest_access_service import (
    GuestEmailAlreadyInUseError,
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


def test_get_or_create_guest_user_refuses_to_adopt_an_existing_account(db_session, invite_link):
    existing = User(
        first_name="Ilaria",
        last_name="Admin",
        email="admin@example.com",
        password_hash="pbkdf2_sha256$1$salt$digest",
        role="admin",
        created_at=datetime.utcnow(),
    )
    db_session.add(existing)
    db_session.commit()

    with pytest.raises(GuestEmailAlreadyInUseError):
        get_or_create_guest_user(db_session, invite_link, "admin@example.com")

    db_session.rollback()
    db_session.refresh(invite_link)
    assert invite_link.user_id is None


@pytest.fixture
def captured_magic_tokens(monkeypatch):
    """Test seam for the magic-link email: RESEND_API_KEY is unset in tests and
    the service swallows EmailSendError, so the raw token is only observable
    from the link URL the service hands to send_email."""
    tokens: list[str] = []

    def fake_send_email(to: str, subject: str, html_body: str) -> None:
        match = re.search(r"token=([A-Za-z0-9_-]+)", html_body)
        assert match, html_body
        tokens.append(match.group(1))

    monkeypatch.setattr("services.guest_access_service.send_email", fake_send_email)
    return tokens


def test_magic_link_issued_on_confirm_can_be_redeemed_for_a_session(
    db_session, invite_link, captured_magic_tokens
):
    confirm_guest_rsvp(db_session, invite_link.token, _guest_payload())
    assert len(captured_magic_tokens) == 1

    session = verify_guest_magic_link(db_session, captured_magic_tokens[0])
    assert session.access_token
    assert session.user.email == "mario@example.com"


def test_expired_magic_link_cannot_be_redeemed(db_session, invite_link, captured_magic_tokens):
    confirm_guest_rsvp(db_session, invite_link.token, _guest_payload())

    link = db_session.query(GuestMagicLink).one()
    link.expires_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    with pytest.raises(GuestMagicLinkInvalidError):
        verify_guest_magic_link(db_session, captured_magic_tokens[0])


def test_magic_link_is_mono_use(db_session, invite_link, captured_magic_tokens):
    confirm_guest_rsvp(db_session, invite_link.token, _guest_payload())

    verify_guest_magic_link(db_session, captured_magic_tokens[0])
    with pytest.raises(GuestMagicLinkInvalidError):
        verify_guest_magic_link(db_session, captured_magic_tokens[0])


def test_requesting_a_new_magic_link_invalidates_the_previous_unused_one(
    db_session, invite_link, captured_magic_tokens
):
    confirm_guest_rsvp(db_session, invite_link.token, _guest_payload())
    request_guest_magic_link(db_session, "mario@example.com")
    assert len(captured_magic_tokens) == 2

    first_token, second_token = captured_magic_tokens
    with pytest.raises(GuestMagicLinkInvalidError):
        verify_guest_magic_link(db_session, first_token)
    assert verify_guest_magic_link(db_session, second_token).access_token


def test_verify_guest_magic_link_rejects_unknown_token(db_session):
    with pytest.raises(GuestMagicLinkInvalidError):
        verify_guest_magic_link(db_session, "not-a-real-token")


def test_request_guest_magic_link_is_silent_for_unknown_email(db_session):
    # Must not raise — uniform response whether or not the email matches a guest.
    request_guest_magic_link(db_session, "nobody@example.com")
