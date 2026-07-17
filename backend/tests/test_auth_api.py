def test_register_creates_user_by_default(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Mikasa",
            "last_name": "Ackerman",
            "email": "mikasa@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["user"]["role"] == "user"
    assert payload["access_token"]


def test_register_admin_without_role_secret_returns_400(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Ilaria",
            "last_name": "Admin",
            "email": "admin-no-secret@test.app",
            "password": "strong-password",
            "role_secret": "wrong-secret",
            "remember_me": True,
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid role secret."


def test_register_creates_admin_with_valid_role_secret(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Ilaria",
            "last_name": "Admin",
            "email": "admin@test.app",
            "password": "strong-password",
            "role_secret": "test-wedding-role-secret",
            "remember_me": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"


def test_login_returns_fresh_session(api_client):
    api_client.post(
        "/auth/register",
        json={
            "first_name": "Armin",
            "last_name": "Arlert",
            "email": "armin@example.com",
            "password": "strong-password",
            "remember_me": False,
        },
    )

    response = api_client.post(
        "/auth/login",
        json={
            "email": "armin@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "armin@example.com"


def test_me_returns_authenticated_user(api_client):
    register_response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Levi",
            "last_name": "Ackerman",
            "email": "levi@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )
    access_token = register_response.json()["access_token"]

    response = api_client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "levi@example.com"


def test_refresh_rotates_session_and_logout_revokes_it(api_client):
    register_response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Historia",
            "last_name": "Reiss",
            "email": "historia@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )
    refresh_token = register_response.json()["refresh_token"]

    refresh_response = api_client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_response.status_code == 200

    new_refresh_token = refresh_response.json()["refresh_token"]
    logout_response = api_client.post("/auth/logout", json={"refresh_token": new_refresh_token})
    assert logout_response.status_code == 200

    second_refresh_response = api_client.post("/auth/refresh", json={"refresh_token": new_refresh_token})
    assert second_refresh_response.status_code == 401


def test_profile_update_changes_first_and_last_name(api_client):
    register_response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Jean",
            "last_name": "Kirschtein",
            "email": "jean@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )
    access_token = register_response.json()["access_token"]

    update_response = api_client.patch(
        "/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"first_name": "Jean", "last_name": "Kirstein"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["last_name"] == "Kirstein"


def test_register_returns_503_when_jwt_secret_missing(api_client, monkeypatch):
    monkeypatch.setattr("services.auth_token_service.read_jwt_secret_key", lambda: "")

    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Armin",
            "last_name": "Arlert",
            "email": "armin@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )
    assert response.status_code == 503


def test_login_returns_503_when_jwt_secret_missing(api_client, monkeypatch):
    api_client.post(
        "/auth/register",
        json={
            "first_name": "Sasha",
            "last_name": "Braus",
            "email": "sasha@example.com",
            "password": "strong-password",
            "remember_me": True,
        },
    )

    monkeypatch.setattr("services.auth_token_service.read_jwt_secret_key", lambda: "")

    response = api_client.post(
        "/auth/login",
        json={"email": "sasha@example.com", "password": "strong-password"},
    )
    assert response.status_code == 503
