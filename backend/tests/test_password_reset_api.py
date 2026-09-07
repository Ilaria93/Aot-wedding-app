import re
from datetime import datetime

from database.base import SessionLocal
from models.user_model import User
from services.auth_credentials_service import hash_password


def _create_admin(email="admin@test.app"):
    db = SessionLocal()
    db.add(
        User(
            first_name="Test",
            last_name="Admin",
            email=email,
            password_hash=hash_password("old-password"),
            role="admin",
            created_at=datetime.utcnow(),
        )
    )
    db.commit()
    db.close()


def _capture_sent_email(monkeypatch):
    sent = {}

    def fake_send(to, subject, text):
        sent["to"] = to
        sent["subject"] = subject
        sent["text"] = text

    monkeypatch.setattr("services.password_reset_service.send_email", fake_send)
    return sent


def _extract_token(text):
    match = re.search(r"token=([A-Za-z0-9_-]+)", text)
    assert match, text
    return match.group(1)


def test_request_reset_for_admin_email_sends_email(api_client, monkeypatch):
    _create_admin("admin@test.app")
    sent = _capture_sent_email(monkeypatch)

    response = api_client.post("/auth/password-reset/request", json={"email": "admin@test.app"})

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert sent["to"] == "admin@test.app"
    assert "token=" in sent["text"]


def test_request_reset_for_unknown_email_is_silent_success(api_client, monkeypatch):
    sent = _capture_sent_email(monkeypatch)

    response = api_client.post("/auth/password-reset/request", json={"email": "nobody@example.com"})

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    assert sent == {}


def test_request_reset_for_guest_account_is_silent_success(api_client, monkeypatch):
    db = SessionLocal()
    db.add(
        User(
            first_name="Guest",
            last_name="Tester",
            email=None,
            password_hash=None,
            role="user",
            created_at=datetime.utcnow(),
        )
    )
    db.commit()
    db.close()
    sent = _capture_sent_email(monkeypatch)

    response = api_client.post("/auth/password-reset/request", json={"email": "nobody@example.com"})

    assert response.status_code == 200
    assert sent == {}


def test_confirm_reset_sets_new_password_and_logs_in(api_client, monkeypatch):
    _create_admin("admin@test.app")
    sent = _capture_sent_email(monkeypatch)
    api_client.post("/auth/password-reset/request", json={"email": "admin@test.app"})
    token = _extract_token(sent["text"])

    confirm_response = api_client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "brand-new-password"}
    )
    assert confirm_response.status_code == 200

    login_response = api_client.post(
        "/auth/login",
        json={"email": "admin@test.app", "password": "brand-new-password", "remember_me": True},
    )
    assert login_response.status_code == 200

    old_password_response = api_client.post(
        "/auth/login",
        json={"email": "admin@test.app", "password": "old-password", "remember_me": True},
    )
    assert old_password_response.status_code == 401


def test_confirm_reset_token_is_single_use(api_client, monkeypatch):
    _create_admin("admin@test.app")
    sent = _capture_sent_email(monkeypatch)
    api_client.post("/auth/password-reset/request", json={"email": "admin@test.app"})
    token = _extract_token(sent["text"])

    first = api_client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "first-new-password"}
    )
    assert first.status_code == 200

    second = api_client.post(
        "/auth/password-reset/confirm", json={"token": token, "new_password": "second-new-password"}
    )
    assert second.status_code == 400
    assert second.json()["detail"]["code"] == "INVALID_RESET_TOKEN"


def test_confirm_reset_rejects_unknown_token(api_client):
    response = api_client.post(
        "/auth/password-reset/confirm", json={"token": "not-a-real-token", "new_password": "whatever123"}
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_RESET_TOKEN"


def test_confirm_reset_rejects_short_password(api_client, monkeypatch):
    _create_admin("admin@test.app")
    sent = _capture_sent_email(monkeypatch)
    api_client.post("/auth/password-reset/request", json={"email": "admin@test.app"})
    token = _extract_token(sent["text"])

    response = api_client.post("/auth/password-reset/confirm", json={"token": token, "new_password": "short"})
    assert response.status_code == 422
