def _register_user(api_client, email: str, first_name: str, last_name: str):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": "strong-password",
            "remember_me": True,
        },
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_rsvp_stats_with_empty_db(api_client, admin_headers):
    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_users"] == 0
    assert data["total_confirmed"] == 0
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 0
    assert data["by_faction"] == {}


def test_rsvp_stats_with_one_attending_user(api_client, admin_headers):
    user_headers = _register_user(api_client, "levi@example.com", "Levi", "Ackerman")
    api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": True, "faction": "scout_regiment"},
    )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_users"] == 1
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 1
    assert data["by_faction"] == {"scout_regiment": 1}


def test_rsvp_stats_with_not_attending_user(api_client, admin_headers):
    user_headers = _register_user(api_client, "zeke@example.com", "Zeke", "Yeager")
    api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": False},
    )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 1
    assert data["by_faction"] == {}


def test_rsvp_stats_with_multiple_factions(api_client, admin_headers):
    users = [
        ("mikasa@example.com", "Mikasa", "Ackerman", "scout_regiment"),
        ("armin@example.com", "Armin", "Arlert", "scout_regiment"),
        ("historia@example.com", "Historia", "Reiss", "military_police"),
    ]
    for email, first_name, last_name, faction in users:
        headers = _register_user(api_client, email, first_name, last_name)
        api_client.post(
            "/rsvp/confirm",
            headers=headers,
            json={"attending": True, "faction": faction},
        )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_users"] == 3
    assert data["total_attending"] == 3
    assert data["by_faction"]["scout_regiment"] == 2
    assert data["by_faction"]["military_police"] == 1
