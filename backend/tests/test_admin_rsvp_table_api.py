from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from database.base import SessionLocal
from main import app
from models.user_model import User
from services.auth_token_service import issue_auth_session


def _guest_client_with_rsvp() -> None:
    """Creates a guest and confirms attendance — the caller reads the
    resulting rsvp_id back from GET /admin/rsvp-entries."""
    db = SessionLocal()
    user = User(
        first_name="Eren",
        last_name="Yeager",
        email=None,
        password_hash=None,
        role="user",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    session = issue_auth_session(db, user, remember_me=False)
    db.close()

    guest_client = TestClient(app)
    guest_client.cookies.set("access_token", session.access_token)
    response = guest_client.post(
        "/rsvp/confirm",
        json={
            "attending": True,
            "guests": [
                {
                    "first_name": "Eren",
                    "last_name": "Yeager",
                    "meal_choice": "standard",
                    "intolerance": "none",
                    "is_child": False,
                }
            ],
        },
    )
    assert response.status_code == 200, response.text


def test_assign_rsvp_table_requires_admin(api_client, user_headers):
    response = api_client.patch("/admin/rsvp/1/table", json={"table_id": 1}, headers=user_headers)
    assert response.status_code == 403


def test_assign_rsvp_table_rejects_unknown_rsvp(api_client, admin_headers):
    response = api_client.patch("/admin/rsvp/999999/table", json={"table_id": 1}, headers=admin_headers)
    assert response.status_code == 404


def test_assign_rsvp_table_rejects_unknown_table(api_client, admin_headers):
    _guest_client_with_rsvp()
    entries = api_client.get("/admin/rsvp-entries", headers=admin_headers).json()["items"]
    rsvp_id = entries[0]["rsvp_id"]

    response = api_client.patch(f"/admin/rsvp/{rsvp_id}/table", json={"table_id": 999999}, headers=admin_headers)
    assert response.status_code == 422


def test_assign_and_clear_rsvp_table(api_client, admin_headers):
    _guest_client_with_rsvp()

    table = api_client.post(
        "/admin/tables", json={"label": "Tavolo 3", "capacity": 10, "note": None}, headers=admin_headers
    ).json()

    entries = api_client.get("/admin/rsvp-entries", headers=admin_headers).json()["items"]
    rsvp_id = entries[0]["rsvp_id"]
    assert entries[0]["table_id"] is None
    assert entries[0]["table_label"] is None

    assign_response = api_client.patch(
        f"/admin/rsvp/{rsvp_id}/table", json={"table_id": table["id"]}, headers=admin_headers
    )
    assert assign_response.status_code == 200
    assert assign_response.json() == {"rsvp_id": rsvp_id, "table_id": table["id"]}

    entries = api_client.get("/admin/rsvp-entries", headers=admin_headers).json()["items"]
    assert entries[0]["table_id"] == table["id"]
    assert entries[0]["table_label"] == "Tavolo 3"

    clear_response = api_client.patch(f"/admin/rsvp/{rsvp_id}/table", json={"table_id": None}, headers=admin_headers)
    assert clear_response.status_code == 200
    assert clear_response.json()["table_id"] is None
