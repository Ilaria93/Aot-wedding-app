from __future__ import annotations


def _guest_line(
    first_name: str = "Mario",
    last_name: str = "Rossi",
    meal_choice: str = "standard",
    intolerance: str = "none",
    dietary_notes: str | None = None,
):
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "meal_choice": meal_choice,
        "intolerance": intolerance,
    }
    if dietary_notes is not None:
        payload["dietary_notes"] = dietary_notes
    return payload


def _attending_payload(guests: list | None = None):
    return {"attending": True, "guests": guests or [_guest_line()]}


def test_rsvp_me_requires_login(api_client):
    response = api_client.get("/rsvp/me")
    assert response.status_code == 401


def test_rsvp_me_is_empty_before_confirmation(api_client, user_headers):
    response = api_client.get("/rsvp/me", headers=user_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["has_rsvp"] is False
    assert body["editable"] is True
    assert body["guests"] == []


def test_rsvp_confirm_requires_login(api_client):
    response = api_client.post("/rsvp/confirm", json=_attending_payload())
    assert response.status_code == 401


def test_rsvp_confirm_requires_guests_when_attending(api_client, user_headers):
    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": True, "guests": []},
    )
    assert response.status_code == 422


def test_rsvp_confirm_rejects_more_than_ten_guests(api_client, user_headers):
    guests = [_guest_line(first_name=f"Guest{i}") for i in range(11)]
    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": True, "guests": guests},
    )
    assert response.status_code == 422


def test_rsvp_confirm_allows_not_attending_without_guests(api_client, user_headers):
    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": False, "guests": []},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["faction"] is None
    assert response.json()["guest_count"] == 0

    lookup_response = api_client.get("/rsvp/me", headers=user_headers)
    body = lookup_response.json()
    assert body["has_rsvp"] is True
    assert body["attending"] is False
    assert body["guests"] == []


def test_rsvp_confirm_assigns_faction_automatically(api_client, user_headers):
    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json=_attending_payload(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["faction"] == "scout_regiment"
    assert body["guest_count"] == 1

    lookup_response = api_client.get("/rsvp/me", headers=user_headers)
    lookup = lookup_response.json()
    assert lookup["faction"] == "scout_regiment"
    assert len(lookup["guests"]) == 1
    assert lookup["guests"][0]["meal_choice"] == "standard"
    assert lookup["guests"][0]["intolerance"] == "none"


def test_rsvp_confirm_balances_factions_by_guest_headcount(api_client):
    def register(email: str):
        from datetime import datetime

        from fastapi.testclient import TestClient

        from database.base import SessionLocal
        from main import app
        from models.user_model import User
        from services.auth_credentials_service import hash_password
        from services.auth_token_service import issue_auth_session

        db = SessionLocal()
        user = User(
            first_name="Test",
            last_name="User",
            email=email,
            password_hash=hash_password("strong-password"),
            role="user",
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.close()

        db = SessionLocal()
        db_user = db.query(User).filter(User.id == user.id).first()
        session = issue_auth_session(db, db_user, remember_me=False)
        db.close()

        # A cookie-jar identity is per-client — this test needs three
        # simultaneous identities, so give each its own isolated client.
        client = TestClient(app)
        client.cookies.set("access_token", session.access_token)
        return client

    client_a = register("a@example.com")
    client_b = register("b@example.com")
    client_c = register("c@example.com")

    client_a.post(
        "/rsvp/confirm",
        json=_attending_payload([_guest_line(), _guest_line(first_name="Luigi")]),
    )
    client_b.post(
        "/rsvp/confirm",
        json=_attending_payload([_guest_line(first_name="Anna")]),
    )
    response_c = client_c.post(
        "/rsvp/confirm",
        json=_attending_payload([_guest_line(first_name="Eren")]),
    )
    assert response_c.json()["faction"] == "military_police"


def test_rsvp_confirm_rejects_duplicate_submission(api_client, user_headers):
    api_client.post("/rsvp/confirm", headers=user_headers, json=_attending_payload())

    response = api_client.post("/rsvp/confirm", headers=user_headers, json=_attending_payload())
    assert response.status_code == 409


def test_rsvp_patch_updates_party(api_client, user_headers):
    api_client.post("/rsvp/confirm", headers=user_headers, json=_attending_payload())

    response = api_client.patch(
        "/rsvp/me",
        headers=user_headers,
        json=_attending_payload(
            [
                _guest_line(first_name="Ilaria", last_name="Bianchi", meal_choice="vegetarian"),
                _guest_line(first_name="Davide", last_name="Verdi", intolerance="lactose"),
            ]
        ),
    )
    assert response.status_code == 200
    assert response.json()["guest_count"] == 2

    lookup = api_client.get("/rsvp/me", headers=user_headers).json()
    assert len(lookup["guests"]) == 2
    assert lookup["guests"][0]["meal_choice"] == "vegetarian"
    assert lookup["guests"][1]["intolerance"] == "lactose"


def test_rsvp_patch_requires_existing_rsvp(api_client, user_headers):
    response = api_client.patch(
        "/rsvp/me",
        headers=user_headers,
        json=_attending_payload(),
    )
    assert response.status_code == 404


def test_rsvp_patch_requires_login(api_client):
    response = api_client.patch("/rsvp/me", json=_attending_payload())
    assert response.status_code == 401


def test_rsvp_confirm_blocked_after_deadline(api_client, user_headers, monkeypatch):
    monkeypatch.setattr(
        "services.rsvp_service.is_rsvp_editable",
        lambda now=None: False,
    )

    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json=_attending_payload(),
    )
    assert response.status_code == 403


def test_rsvp_patch_blocked_after_deadline(api_client, user_headers, monkeypatch):
    api_client.post("/rsvp/confirm", headers=user_headers, json=_attending_payload())

    monkeypatch.setattr(
        "services.rsvp_service.is_rsvp_editable",
        lambda now=None: False,
    )

    response = api_client.patch(
        "/rsvp/me",
        headers=user_headers,
        json=_attending_payload([_guest_line(first_name="Updated")]),
    )
    assert response.status_code == 403
