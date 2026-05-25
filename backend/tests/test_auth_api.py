def test_register_creates_invited_user_by_default(api_client):
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
    assert payload["token_type"] == "bearer"
    assert payload["remember_me"] is True
    assert payload["user"]["email"] == "mikasa@example.com"
    assert payload["user"]["role"] == "invited"
    assert payload["access_token"]
    assert payload["refresh_token"]


def test_register_assigns_admin_role_for_allowed_email(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Ilaria",
            "last_name": "Bride",
            "email": "admin@test.app",
            "password": "strong-password",
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
    payload = response.json()
    assert payload["remember_me"] is True
    assert payload["user"]["email"] == "armin@example.com"


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
    assert logout_response.json()["ok"] is True

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
