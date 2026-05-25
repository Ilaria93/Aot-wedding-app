def test_rsvp_stats_with_empty_db(api_client, admin_headers):
    # Stats must return all zeros when no guests exist.
    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_invited"] == 0
    assert data["total_confirmed"] == 0
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 0
    assert data["by_faction"] == {}


def test_rsvp_stats_with_one_attending_guest(api_client, admin_headers):
    # Creates one guest, confirms RSVP as attending and checks stats.
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Levi Ackerman"},
    )
    token = create_response.json()["invitation_token"]

    api_client.post(
        "/rsvp/confirm",
        json={"invitation_token": token, "attending": True, "faction": "scout_regiment"},
    )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_invited"] == 1
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 1
    assert data["total_not_attending"] == 0
    assert data["by_faction"] == {"scout_regiment": 1}


def test_rsvp_stats_with_not_attending_guest(api_client, admin_headers):
    # Not-attending guest must not appear in by_faction counts.
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Zeke Yeager"},
    )
    token = create_response.json()["invitation_token"]

    api_client.post(
        "/rsvp/confirm",
        json={"invitation_token": token, "attending": False},
    )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 1
    assert data["by_faction"] == {}


def test_rsvp_stats_with_multiple_factions(api_client, admin_headers):
    # Counts must reflect correct faction distribution.
    guests = [
        ("Mikasa Ackerman", "scout_regiment"),
        ("Armin Arlert", "scout_regiment"),
        ("Historia Reiss", "military_police"),
    ]
    for name, faction in guests:
        res = api_client.post(
            "/guest/create-invite",
            headers=admin_headers,
            json={"full_name": name},
        )
        token = res.json()["invitation_token"]
        api_client.post(
            "/rsvp/confirm",
            json={"invitation_token": token, "attending": True, "faction": faction},
        )

    response = api_client.get("/admin/rsvp-stats", headers=admin_headers)
    data = response.json()
    assert data["total_invited"] == 3
    assert data["total_attending"] == 3
    assert data["by_faction"]["scout_regiment"] == 2
    assert data["by_faction"]["military_police"] == 1
