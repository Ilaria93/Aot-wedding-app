from datetime import datetime

from database.base import SessionLocal
from models.user_model import User
from services.auth_credentials_service import hash_password


def _create_user(email, password=None, role="user", first_name="Test", last_name="User"):
    db = SessionLocal()
    db.add(
        User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password) if password else None,
            role=role,
            created_at=datetime.utcnow(),
        )
    )
    db.commit()
    db.close()


def test_login_returns_fresh_session(api_client):
    _create_user("armin@example.com", "strong-password")

    response = api_client.post(
        "/auth/login",
        json={"email": "armin@example.com", "password": "strong-password", "remember_me": True},
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "armin@example.com"


def test_login_with_wrong_password_is_401(api_client):
    _create_user("mikasa@example.com", "strong-password")

    response = api_client.post(
        "/auth/login",
        json={"email": "mikasa@example.com", "password": "wrong-password", "remember_me": True},
    )
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_login_with_a_passwordless_guest_email_is_a_plain_401(api_client):
    """Guest accounts store password_hash = NULL. Password login must fail the
    same way an unknown email does — a 500 would leak which emails are guests."""
    _create_user("passwordless@example.com", password=None)

    response = api_client.post(
        "/auth/login",
        json={"email": "passwordless@example.com", "password": "anything-at-all", "remember_me": False},
    )
    assert response.status_code == 401, response.text


def test_login_with_unknown_email_is_401(api_client):
    response = api_client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "anything-at-all", "remember_me": False},
    )
    assert response.status_code == 401


def test_me_returns_authenticated_user(api_client):
    _create_user("levi@example.com", "strong-password")
    login_response = api_client.post(
        "/auth/login",
        json={"email": "levi@example.com", "password": "strong-password", "remember_me": True},
    )
    access_token = login_response.json()["access_token"]

    response = api_client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "levi@example.com"


def test_refresh_rotates_session_and_logout_revokes_it(api_client):
    _create_user("historia@example.com", "strong-password")
    login_response = api_client.post(
        "/auth/login",
        json={"email": "historia@example.com", "password": "strong-password", "remember_me": True},
    )
    refresh_token = login_response.json()["refresh_token"]

    refresh_response = api_client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_response.status_code == 200

    new_refresh_token = refresh_response.json()["refresh_token"]
    logout_response = api_client.post("/auth/logout", json={"refresh_token": new_refresh_token})
    assert logout_response.status_code == 200

    second_refresh_response = api_client.post("/auth/refresh", json={"refresh_token": new_refresh_token})
    assert second_refresh_response.status_code == 401


def test_profile_update_changes_first_and_last_name(api_client):
    _create_user("jean@example.com", "strong-password", first_name="Jean", last_name="Kirschtein")
    login_response = api_client.post(
        "/auth/login",
        json={"email": "jean@example.com", "password": "strong-password", "remember_me": True},
    )
    access_token = login_response.json()["access_token"]

    update_response = api_client.patch(
        "/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"first_name": "Jean", "last_name": "Kirstein"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["last_name"] == "Kirstein"


def test_login_returns_503_when_jwt_secret_missing(api_client, monkeypatch):
    _create_user("sasha@example.com", "strong-password")
    monkeypatch.setattr("services.auth_token_service.read_jwt_secret_key", lambda: "")

    response = api_client.post(
        "/auth/login",
        json={"email": "sasha@example.com", "password": "strong-password"},
    )
    assert response.status_code == 503
