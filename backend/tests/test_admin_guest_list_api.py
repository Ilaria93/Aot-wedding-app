def test_admin_guest_list_is_empty_on_fresh_db(api_client, admin_headers):
    # Admin list must be empty when no guests exist.
    response = api_client.get("/admin/guests", headers=admin_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_admin_guest_list_shows_guest_without_rsvp(api_client, admin_headers):
    # Creates a guest with no RSVP and checks it appears correctly.
    api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Armin Arlert"},
    )

    response = api_client.get("/admin/guests", headers=admin_headers)
    assert response.status_code == 200
    guests = response.json()
    assert len(guests) == 1
    assert guests[0]["full_name"] == "Armin Arlert"
    assert guests[0]["has_rsvp"] is False
    assert guests[0]["attending"] is None
    assert guests[0]["faction"] is None


def test_admin_guest_list_shows_guest_with_confirmed_rsvp(api_client, admin_headers, invited_headers):
    # Creates a guest, confirms RSVP and verifies admin list reflects it.
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Eren Yeager"},
    )
    token = create_response.json()["invitation_token"]

    api_client.post(
        "/rsvp/confirm",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "attending": True,
            "faction": "garrison",
        },
    )

    response = api_client.get("/admin/guests", headers=admin_headers)
    assert response.status_code == 200
    guests = response.json()
    assert len(guests) == 1
    assert guests[0]["full_name"] == "Eren Yeager"
    assert guests[0]["has_rsvp"] is True
    assert guests[0]["attending"] is True
    assert guests[0]["faction"] == "garrison"


def test_admin_guest_list_shows_declined_guest_without_faction(api_client, admin_headers, invited_headers):
    # Declined guests should not expose a fake faction in admin list.
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Reiner Braun"},
    )
    token = create_response.json()["invitation_token"]

    api_client.post(
        "/rsvp/confirm",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "attending": False,
        },
    )

    response = api_client.get("/admin/guests", headers=admin_headers)
    assert response.status_code == 200
    guests = response.json()
    assert len(guests) == 1
    assert guests[0]["full_name"] == "Reiner Braun"
    assert guests[0]["has_rsvp"] is True
    assert guests[0]["attending"] is False
    assert guests[0]["faction"] is None


def test_admin_guest_list_shows_multiple_guests(api_client, admin_headers):
    # Creates multiple guests and verifies all appear in the list.
    api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Levi Ackerman"},
    )
    api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Historia Reiss"},
    )

    response = api_client.get("/admin/guests", headers=admin_headers)
    assert response.status_code == 200
    names = [g["full_name"] for g in response.json()]
    assert "Levi Ackerman" in names
    assert "Historia Reiss" in names
