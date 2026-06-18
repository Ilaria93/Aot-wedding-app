def test_admin_user_list_rejects_without_header(api_client):
    response = api_client.get("/admin/users")
    assert response.status_code == 401


def test_admin_user_list_rejects_non_admin_user(api_client, user_headers):
    response = api_client.get("/admin/users", headers=user_headers)
    assert response.status_code == 403


def test_admin_user_list_allows_admin_role(api_client, admin_headers):
    response = api_client.get("/admin/users", headers=admin_headers)
    assert response.status_code == 200


def test_admin_rsvp_stats_rejects_without_header(api_client):
    response = api_client.get("/admin/rsvp-stats")
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


def test_admin_contacts_reject_non_admin_user(api_client, user_headers):
    response = api_client.get("/admin/contacts", headers=user_headers)
    assert response.status_code == 403
