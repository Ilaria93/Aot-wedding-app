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


def test_guest_rsvp_never_adopts_an_existing_account_by_email(api_client, invite_token, admin_headers):
    """An invite-token holder must not be able to log in as the couple by
    typing the admin's address into the RSVP form."""
    response = api_client.post(
        f"/invites/{invite_token}/rsvp",
        json={"email": "admin@test.app", "attending": True, "guests": [_guest_line()]},
    )
    assert response.status_code == 409, response.text
    assert "session" not in response.json()

    # The failed attempt must not have claimed the invite either: the real
    # guest can still confirm, and gets a plain non-admin account.
    recovered = api_client.post(
        f"/invites/{invite_token}/rsvp",
        json={"email": "mario@example.com", "attending": True, "guests": [_guest_line()]},
    )
    assert recovered.status_code == 200, recovered.text
    assert recovered.json()["session"]["user"]["role"] == "user"
    assert recovered.json()["session"]["user"]["email"] == "mario@example.com"


def test_guest_rsvp_rejects_email_already_used_by_another_invite(api_client, invite_token):
    session = SessionLocal()
    session.add(
        InviteLink(
            token="party-token-def",
            first_name="Giulia",
            last_name="Bianchi",
            created_at=datetime.utcnow(),
        )
    )
    session.commit()
    session.close()

    first = api_client.post(
        f"/invites/{invite_token}/rsvp",
        json={"email": "mario@example.com", "attending": True, "guests": [_guest_line()]},
    )
    assert first.status_code == 200, first.text
    first_access_token = first.json()["session"]["access_token"]

    second = api_client.post(
        "/invites/party-token-def/rsvp",
        json={"email": "mario@example.com", "attending": True, "guests": [_guest_line()]},
    )
    assert second.status_code == 409, second.text

    # The first invite's guest is untouched by the collision.
    me_response = api_client.get(
        "/rsvp/me", headers={"Authorization": f"Bearer {first_access_token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["has_rsvp"] is True


def test_guest_rsvp_rejects_malformed_and_oversized_emails(api_client, invite_token):
    for bad_email in ["not-an-email", "a" * 200 + "@example.com"]:
        response = api_client.post(
            f"/invites/{invite_token}/rsvp",
            json={"email": bad_email, "attending": True, "guests": [_guest_line()]},
        )
        assert response.status_code == 422, (bad_email, response.text)


def test_guest_rsvp_second_submission_updates_instead_of_409(api_client, invite_token):
    payload = {"email": "mario@example.com", "attending": True, "guests": [_guest_line()]}
    first = api_client.post(f"/invites/{invite_token}/rsvp", json=payload)
    assert first.status_code == 200

    payload["guests"] = [_guest_line(), _guest_line("Giulia", "Rossi")]
    second = api_client.post(f"/invites/{invite_token}/rsvp", json=payload)
    assert second.status_code == 200
    assert second.json()["rsvp"]["guest_count"] == 2
