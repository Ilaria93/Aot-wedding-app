from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from database.base import SessionLocal
from main import app
from models.user_model import User
from services.auth_token_service import issue_auth_session


def _guest_client(first_name: str = "Guest", last_name: str = "Tester") -> TestClient:
    db = SessionLocal()
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=None,
        password_hash=None,
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

    client = TestClient(app)
    client.cookies.set("access_token", session.access_token)
    return client


def _guest_line(first_name, last_name, meal_choice="standard", intolerance="none", is_child=False, dietary_notes=None):
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "meal_choice": meal_choice,
        "intolerance": intolerance,
        "is_child": is_child,
    }
    if dietary_notes is not None:
        payload["dietary_notes"] = dietary_notes
    return payload


def test_admin_rsvp_entries_requires_login(api_client):
    response = api_client.get("/admin/rsvp-entries")
    assert response.status_code == 401


def test_admin_rsvp_entries_rejects_non_admin(api_client, user_headers):
    response = api_client.get("/admin/rsvp-entries", headers=user_headers)
    assert response.status_code == 403


def test_admin_rsvp_entries_returns_confirmed_guest_details(api_client, admin_headers):
    guest_client = _guest_client("Levi", "Ackerman")
    guest_client.post(
        "/rsvp/confirm",
        json={
            "attending": True,
            "guests": [
                _guest_line("Levi", "Ackerman"),
                _guest_line("Petra", "Ral", meal_choice="vegetarian", is_child=True, dietary_notes="No nuts"),
            ],
        },
    )

    response = api_client.get("/admin/rsvp-entries", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    entry = body["items"][0]
    assert entry["guest_count"] == 2
    assert entry["has_child"] is True
    assert entry["has_special_diet"] is True
    assert entry["account_holder"]["first_name"] == "Levi"
    assert entry["companions"][0]["first_name"] == "Petra"
    assert entry["companions"][0]["is_child"] is True


def test_admin_rsvp_entries_excludes_not_attending(api_client, admin_headers):
    guest_client = _guest_client("Zeke", "Yeager")
    guest_client.post("/rsvp/confirm", json={"attending": False, "guests": []})

    response = api_client.get("/admin/rsvp-entries", headers=admin_headers)
    assert response.json()["total"] == 0


def test_admin_rsvp_entries_filter_special_diet(api_client, admin_headers):
    plain_client = _guest_client("Armin", "Arlert")
    plain_client.post("/rsvp/confirm", json={"attending": True, "guests": [_guest_line("Armin", "Arlert")]})

    diet_client = _guest_client("Sasha", "Braus")
    diet_client.post(
        "/rsvp/confirm",
        json={"attending": True, "guests": [_guest_line("Sasha", "Braus", intolerance="gluten")]},
    )

    response = api_client.get("/admin/rsvp-entries", headers=admin_headers, params={"filter": "special_diet"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["account_holder"]["first_name"] == "Sasha"


def test_admin_rsvp_entries_filter_children(api_client, admin_headers):
    adult_client = _guest_client("Jean", "Kirstein")
    adult_client.post("/rsvp/confirm", json={"attending": True, "guests": [_guest_line("Jean", "Kirstein")]})

    family_client = _guest_client("Historia", "Reiss")
    family_client.post(
        "/rsvp/confirm",
        json={"attending": True, "guests": [_guest_line("Historia", "Reiss", is_child=True)]},
    )

    response = api_client.get("/admin/rsvp-entries", headers=admin_headers, params={"filter": "children"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["account_holder"]["first_name"] == "Historia"


def test_admin_rsvp_entries_search_matches_guest_name(api_client, admin_headers):
    client_a = _guest_client("Connie", "Springer")
    client_a.post("/rsvp/confirm", json={"attending": True, "guests": [_guest_line("Connie", "Springer")]})

    client_b = _guest_client("Ymir", "None")
    client_b.post("/rsvp/confirm", json={"attending": True, "guests": [_guest_line("Ymir", "None")]})

    response = api_client.get("/admin/rsvp-entries", headers=admin_headers, params={"search": "connie"})
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["account_holder"]["first_name"] == "Connie"


def test_admin_rsvp_entries_pagination(api_client, admin_headers):
    for index in range(3):
        client = _guest_client(f"Guest{index}", "Tester")
        client.post("/rsvp/confirm", json={"attending": True, "guests": [_guest_line(f"Guest{index}", "Tester")]})

    response = api_client.get("/admin/rsvp-entries", headers=admin_headers, params={"page": 1, "page_size": 2})
    body = response.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["page_size"] == 2
