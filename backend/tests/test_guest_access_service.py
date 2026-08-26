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
