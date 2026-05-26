def test_create_invite_rejects_without_bearer_token(api_client):
    response = api_client.post("/guest/create-invite", json={"full_name": "Nobody"})
    assert response.status_code == 401


def test_create_invite_rejects_invalid_bearer_token(api_client):
    response = api_client.post(
        "/guest/create-invite",
        headers={"Authorization": "Bearer not-a-real-token"},
        json={"full_name": "Nobody"},
    )
    assert response.status_code == 401


def test_create_invite_rejects_non_admin_user(api_client, invited_headers):
    response = api_client.post(
        "/guest/create-invite",
        headers=invited_headers,
        json={"full_name": "Nobody"},
    )
    assert response.status_code == 403


def test_admin_guest_list_rejects_without_header(api_client):
    response = api_client.get("/admin/guests")
    assert response.status_code == 401


def test_admin_guest_list_rejects_non_admin_user(api_client, invited_headers):
    response = api_client.get("/admin/guests", headers=invited_headers)
    assert response.status_code == 403


def test_admin_guest_list_allows_groom_role(api_client, groom_headers):
    response = api_client.get("/admin/guests", headers=groom_headers)
    assert response.status_code == 200


def test_admin_rsvp_stats_rejects_without_header(api_client):
    response = api_client.get("/admin/rsvp-stats")
    assert response.status_code == 401


def test_admin_photo_list_rejects_without_header(api_client):
    response = api_client.get("/admin/photos")
    assert response.status_code == 401


def test_admin_contacts_reject_without_header(api_client):
    list_response = api_client.get("/admin/contacts")
    create_response = api_client.post(
        "/admin/contacts",
        json={
            "category": "hotel",
            "label": "Hotel Test",
        },
    )
    assert list_response.status_code == 401
    assert create_response.status_code == 401


def test_admin_contacts_reject_non_admin_user(api_client, invited_headers):
    response = api_client.get("/admin/contacts", headers=invited_headers)
    assert response.status_code == 403
