def test_rsvp_stats_with_empty_db(api_client):
    # Stats must return all zeros when no guests exist.
    response = api_client.get("/admin/rsvp-stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_invited"] == 0
    assert data["total_confirmed"] == 0
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 0
    assert data["by_faction"] == {}


def test_rsvp_stats_with_one_attending_guest(api_client):
    # Creates one guest, confirms RSVP as attending and checks stats.
    create_response = api_client.post(
        "/guest/create-invite",
        json={"full_name": "Levi Ackerman"},
    )
    token = create_response.json()["invitation_token"]

    api_client.post(
        "/rsvp/confirm",
        json={"invitation_token": token, "attending": True, "faction": "scout_regiment"},
    )

    response = api_client.get("/admin/rsvp-stats")
    data = response.json()
    assert data["total_invited"] == 1
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 1
    assert data["total_not_attending"] == 0
    assert data["by_faction"] == {"scout_regiment": 1}


def test_rsvp_stats_with_not_attending_guest(api_client):
    # Not-attending guest must not appear in by_faction counts.
    create_response = api_client.post(
        "/guest/create-invite",
        json={"full_name": "Zeke Yeager"},
    )
    token = create_response.json()["invitation_token"]

    api_client.post(
        "/rsvp/confirm",
        json={"invitation_token": token, "attending": False, "faction": "garrison"},
    )

    response = api_client.get("/admin/rsvp-stats")
    data = response.json()
    assert data["total_confirmed"] == 1
    assert data["total_attending"] == 0
    assert data["total_not_attending"] == 1
    assert data["by_faction"] == {}


def test_rsvp_stats_with_multiple_factions(api_client):
    # Counts must reflect correct faction distribution.
    guests = [
        ("Mikasa Ackerman", "scout_regiment"),
        ("Armin Arlert", "scout_regiment"),
        ("Historia Reiss", "military_police"),
    ]
    for name, faction in guests:
        res = api_client.post("/guest/create-invite", json={"full_name": name})
        token = res.json()["invitation_token"]
        api_client.post(
            "/rsvp/confirm",
            json={"invitation_token": token, "attending": True, "faction": faction},
        )

    response = api_client.get("/admin/rsvp-stats")
    data = response.json()
    assert data["total_invited"] == 3
    assert data["total_attending"] == 3
    assert data["by_faction"]["scout_regiment"] == 2
    assert data["by_faction"]["military_police"] == 1
