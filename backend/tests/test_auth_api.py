TEST_SECRET = "test-wedding-secret"


def _configure_secret(monkeypatch, secret=TEST_SECRET):
    monkeypatch.setattr("services.auth_service.read_wedding_admin_secret", lambda: secret)


def test_login_with_correct_secret_returns_admin_session(api_client, monkeypatch):
    _configure_secret(monkeypatch)

    response = api_client.post("/auth/login", json={"secret": TEST_SECRET, "remember_me": True})
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "admin"
    assert body["first_name"] == "Sposi"


def test_login_with_wrong_secret_is_401(api_client, monkeypatch):
    _configure_secret(monkeypatch)

    response = api_client.post("/auth/login", json={"secret": "not-the-secret", "remember_me": True})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_login_is_401_when_server_has_no_secret_configured(api_client, monkeypatch):
    _configure_secret(monkeypatch, secret="")

    response = api_client.post("/auth/login", json={"secret": "anything-at-all", "remember_me": True})
    assert response.status_code == 401


def test_login_reuses_the_same_admin_account_across_logins(api_client, monkeypatch):
    _configure_secret(monkeypatch)

    first = api_client.post("/auth/login", json={"secret": TEST_SECRET, "remember_me": True})
    api_client.post("/auth/logout")
    second = api_client.post("/auth/login", json={"secret": TEST_SECRET, "remember_me": True})

    assert first.json()["id"] == second.json()["id"]


def test_me_returns_authenticated_user(api_client, monkeypatch):
    _configure_secret(monkeypatch)
    login_response = api_client.post("/auth/login", json={"secret": TEST_SECRET, "remember_me": True})
    assert login_response.status_code == 200

    response = api_client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_refresh_rotates_session_and_logout_revokes_it(api_client, monkeypatch):
    _configure_secret(monkeypatch)
    login_response = api_client.post("/auth/login", json={"secret": TEST_SECRET, "remember_me": True})
    assert login_response.status_code == 200

    refresh_response = api_client.post("/auth/refresh")
    assert refresh_response.status_code == 200

    logout_response = api_client.post("/auth/logout")
    assert logout_response.status_code == 200

    second_refresh_response = api_client.post("/auth/refresh")
    assert second_refresh_response.status_code == 401


def test_profile_update_changes_first_and_last_name(api_client, monkeypatch):
    _configure_secret(monkeypatch)
    login_response = api_client.post("/auth/login", json={"secret": TEST_SECRET, "remember_me": True})
    assert login_response.status_code == 200

    update_response = api_client.patch(
        "/auth/me",
        json={"first_name": "Ilaria & Davide", "last_name": ""},
    )
    assert update_response.status_code == 200
    assert update_response.json()["first_name"] == "Ilaria & Davide"


def test_login_returns_503_when_jwt_secret_missing(api_client, monkeypatch):
    _configure_secret(monkeypatch)
    monkeypatch.setattr("services.auth_token_service.read_jwt_secret_key", lambda: "")

    response = api_client.post("/auth/login", json={"secret": TEST_SECRET})
    assert response.status_code == 503
