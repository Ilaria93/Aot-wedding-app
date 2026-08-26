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
