def test_create_invite_then_lookup_guest(api_client):
    # Creates a guest invitation token from API.
    create_response = api_client.post(
        "/guest/create-invite",
        json={"full_name": "Levi Ackerman"},
    )
    assert create_response.status_code == 200
    created_payload = create_response.json()
    assert created_payload["full_name"] == "Levi Ackerman"
    assert created_payload["invitation_token"]

    # Fetches guest data using the token returned above.
    token = created_payload["invitation_token"]
    lookup_response = api_client.get(f"/guest/{token}")
    assert lookup_response.status_code == 200
    lookup_payload = lookup_response.json()
    assert lookup_payload["full_name"] == "Levi Ackerman"
    assert lookup_payload["invitation_token"] == token


def test_rsvp_lookup_before_and_after_confirmation(api_client):
    # Creates invite used to test RSVP lookup flow.
    create_response = api_client.post(
        "/guest/create-invite",
        json={"full_name": "Mikasa Ackerman"},
    )
    token = create_response.json()["invitation_token"]

    # Checks RSVP status before confirmation.
    pre_rsvp_lookup_response = api_client.get(f"/rsvp/by-token/{token}")
    assert pre_rsvp_lookup_response.status_code == 200
    pre_rsvp_lookup_payload = pre_rsvp_lookup_response.json()
    assert pre_rsvp_lookup_payload["has_rsvp"] is False
    assert pre_rsvp_lookup_payload["guest_full_name"] == "Mikasa Ackerman"

    # Confirms RSVP.
    confirm_response = api_client.post(
        "/rsvp/confirm",
        json={
            "invitation_token": token,
            "attending": True,
            "faction": "scout_regiment",
            "dietary_notes": "vegetarian",
        },
    )
    assert confirm_response.status_code == 200

    # Checks RSVP status after confirmation.
    post_rsvp_lookup_response = api_client.get(f"/rsvp/by-token/{token}")
    assert post_rsvp_lookup_response.status_code == 200
    post_rsvp_lookup_payload = post_rsvp_lookup_response.json()
    assert post_rsvp_lookup_payload["has_rsvp"] is True
    assert post_rsvp_lookup_payload["guest_full_name"] == "Mikasa Ackerman"
    assert post_rsvp_lookup_payload["attending"] is True
    assert post_rsvp_lookup_payload["faction"] == "scout_regiment"
