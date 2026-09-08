def test_admin_user_list_shows_only_admin_on_fresh_db(api_client, admin_headers):
    response = api_client.get("/admin/users", headers=admin_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 1
    assert users[0]["role"] == "admin"


def test_admin_user_list_shows_registered_users(api_client, admin_headers, user_headers):
    _ = user_headers
    response = api_client.get("/admin/users", headers=admin_headers)
    assert response.status_code == 200

    users = response.json()
    assert len(users) == 2
    user_row = next(user for user in users if user["role"] != "admin")
    assert user_row["has_rsvp"] is False


def test_admin_user_list_shows_user_with_confirmed_rsvp(api_client, admin_headers):
    # A shared client can only hold one cookie-based identity at a time, and
    # this test needs the guest and the admin logged in simultaneously — give
    # the guest its own isolated client instead of reusing user_headers here.
    from datetime import datetime

    from fastapi.testclient import TestClient

    from database.base import SessionLocal
    from main import app
    from models.user_model import User
    from services.auth_token_service import issue_auth_session

    db = SessionLocal()
    guest = User(first_name="Guest", last_name="Tester", email=None, password_hash=None, role="user", created_at=datetime.utcnow())
    db.add(guest)
    db.commit()
    db.refresh(guest)
    db.close()

    db = SessionLocal()
    db_guest = db.query(User).filter(User.id == guest.id).first()
    session = issue_auth_session(db, db_guest, remember_me=False)
    db.close()

    guest_client = TestClient(app)
    guest_client.cookies.set("access_token", session.access_token)
    guest_client.post(
        "/rsvp/confirm",
        json={
            "attending": True,
            "guests": [
                {
                    "first_name": "Mario",
                    "last_name": "Rossi",
                    "meal_choice": "standard",
                    "intolerance": "none",
                }
            ],
        },
    )

    response = api_client.get("/admin/users", headers=admin_headers)
    users = response.json()
    user_row = next(user for user in users if user["role"] != "admin")
    assert user_row["has_rsvp"] is True
    assert user_row["attending"] is True
    assert user_row["faction"] == "scout_regiment"
