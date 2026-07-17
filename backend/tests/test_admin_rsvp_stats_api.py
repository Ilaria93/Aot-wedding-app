from __future__ import annotations


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
    user_headers = _register_user(api_client, "levi@example.com", "Levi", "Ackerman")
    api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json=_attending_payload(),
    )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_users"] == 1
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 1
    assert data["total_participants"] == 1
    assert data["by_faction"] == {"scout_regiment": 1}


def test_rsvp_stats_with_not_attending_user(api_client, admin_headers):
    user_headers = _register_user(api_client, "zeke@example.com", "Zeke", "Yeager")
    api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={"attending": False, "guests": []},
    )

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
        headers = _register_user(api_client, email, first_name, last_name)
        guests = [
            {
                "first_name": f"{first_name}{index}",
                "last_name": last_name,
                "meal_choice": "standard",
                "intolerance": "none",
            }
            for index in range(guest_count)
        ]
        api_client.post(
            "/rsvp/confirm",
            headers=headers,
            json=_attending_payload(guests),
        )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_users"] == 2
    assert data["total_attending"] == 2
    assert data["total_participants"] == 3
    assert sum(data["by_faction"].values()) == 3
