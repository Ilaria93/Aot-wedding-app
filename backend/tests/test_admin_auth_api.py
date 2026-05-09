def test_create_invite_rejects_without_admin_header(api_client):
    response = api_client.post("/guest/create-invite", json={"full_name": "Nobody"})
    assert response.status_code == 401


def test_create_invite_rejects_wrong_admin_key(api_client, admin_headers):
    bad_headers = {**admin_headers, "X-Admin-Api-Key": "not-the-real-secret"}
    response = api_client.post(
        "/guest/create-invite",
        headers=bad_headers,
        json={"full_name": "Nobody"},
    )
    assert response.status_code == 401


def test_admin_guest_list_rejects_without_header(api_client):
    response = api_client.get("/admin/guests")
    assert response.status_code == 401


def test_admin_rsvp_stats_rejects_without_header(api_client):
    response = api_client.get("/admin/rsvp-stats")
    assert response.status_code == 401
