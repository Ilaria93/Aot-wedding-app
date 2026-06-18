def test_rsvp_me_requires_login(api_client):
    response = api_client.get("/rsvp/me")
    assert response.status_code == 401


def test_rsvp_me_is_empty_before_confirmation(api_client, user_headers):
    response = api_client.get("/rsvp/me", headers=user_headers)
    assert response.status_code == 200
    assert response.json()["has_rsvp"] is False


def test_rsvp_confirm_requires_login(api_client):
    response = api_client.post(
        "/rsvp/confirm",
        json={"attending": True, "faction": "scout_regiment"},
    )
    assert response.status_code == 401


def test_rsvp_confirm_requires_faction_when_attending(api_client, user_headers):
    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": True},
    )
    assert response.status_code == 422


def test_rsvp_confirm_allows_missing_faction_when_not_attending(api_client, user_headers):
    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": False},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True

    lookup_response = api_client.get("/rsvp/me", headers=user_headers)
    assert lookup_response.json()["has_rsvp"] is True
    assert lookup_response.json()["attending"] is False


def test_rsvp_confirm_rejects_duplicate_submission(api_client, user_headers):
    api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": True, "faction": "garrison"},
    )

    response = api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": True, "faction": "garrison"},
    )
    assert response.status_code == 409
