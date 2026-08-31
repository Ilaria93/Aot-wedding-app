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
