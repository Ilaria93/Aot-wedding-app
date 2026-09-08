from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from database.base import SessionLocal
from main import app
from models.user_model import User
from services.auth_credentials_service import hash_password
from services.auth_token_service import issue_auth_session


def _register_user(email: str, first_name: str, last_name: str):
    db = SessionLocal()
    user = User(
        first_name=first_name,
        last_name=last_name,
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

    # A cookie-jar identity is per-client — give this user its own isolated
    # client so it can act alongside the admin_headers session on api_client
    # without either clobbering the other.
    client = TestClient(app)
    client.cookies.set("access_token", session.access_token)
    return client


def _attending_payload(guests: list | None = None):
    if guests is None:
        guests = [
            {
                "first_name": "Mario",
                "last_name": "Rossi",
                "meal_choice": "standard",
                "intolerance": "none",
            }
        ]
    return {"attending": True, "guests": guests}


def test_rsvp_stats_with_empty_db(api_client, admin_headers):
    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_users"] == 0
    assert data["total_confirmed"] == 0
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 0
    assert data["total_participants"] == 0
    assert data["by_faction"] == {}


def test_rsvp_stats_with_one_attending_user(api_client, admin_headers):
    user_client = _register_user("levi@example.com", "Levi", "Ackerman")
    user_client.post("/rsvp/confirm", json=_attending_payload())

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_users"] == 1
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 1
    assert data["total_participants"] == 1
    assert data["by_faction"] == {"scout_regiment": 1}


def test_rsvp_stats_with_not_attending_user(api_client, admin_headers):
    user_client = _register_user("zeke@example.com", "Zeke", "Yeager")
    user_client.post("/rsvp/confirm", json={"attending": False, "guests": []})

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 1
    assert data["total_participants"] == 0
    assert data["by_faction"] == {}


def test_rsvp_stats_counts_guests_per_faction(api_client, admin_headers):
    users = [
        ("mikasa@example.com", "Mikasa", "Ackerman", 2),
        ("armin@example.com", "Armin", "Arlert", 1),
    ]
    for email, first_name, last_name, guest_count in users:
        user_client = _register_user(email, first_name, last_name)
        guests = [
            {
                "first_name": f"{first_name}{index}",
                "last_name": last_name,
                "meal_choice": "standard",
                "intolerance": "none",
            }
            for index in range(guest_count)
        ]
        user_client.post("/rsvp/confirm", json=_attending_payload(guests))

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_users"] == 2
    assert data["total_attending"] == 2
    assert data["total_participants"] == 3
    assert sum(data["by_faction"].values()) == 3
