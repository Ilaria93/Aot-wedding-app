from __future__ import annotations


def test_list_tables_requires_admin(api_client, user_headers):
    response = api_client.get("/admin/tables", headers=user_headers)
    assert response.status_code == 403


def test_create_list_update_delete_table(api_client, admin_headers):
    create_response = api_client.post(
        "/admin/tables",
        json={"label": "Tavolo 01 · Scouting", "capacity": 10, "note": "Capienza standard"},
        headers=admin_headers,
    )
    assert create_response.status_code == 200
    table = create_response.json()
    assert table["label"] == "Tavolo 01 · Scouting"
    assert table["capacity"] == 10
    assert table["note"] == "Capienza standard"

    list_response = api_client.get("/admin/tables", headers=admin_headers)
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [table["id"]]

    update_response = api_client.patch(
        f"/admin/tables/{table['id']}", json={"capacity": 12}, headers=admin_headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["capacity"] == 12
    assert update_response.json()["label"] == "Tavolo 01 · Scouting"

    delete_response = api_client.delete(f"/admin/tables/{table['id']}", headers=admin_headers)
    assert delete_response.status_code == 204

    list_after_delete = api_client.get("/admin/tables", headers=admin_headers)
    assert list_after_delete.json() == []


def test_update_and_delete_unknown_table_returns_404(api_client, admin_headers):
    update_response = api_client.patch("/admin/tables/999999", json={"capacity": 5}, headers=admin_headers)
    assert update_response.status_code == 404

    delete_response = api_client.delete("/admin/tables/999999", headers=admin_headers)
    assert delete_response.status_code == 404


def test_cannot_delete_table_with_assigned_guests(api_client, admin_headers, user_headers):
    table = api_client.post(
        "/admin/tables", json={"label": "Tavolo 02", "capacity": 8, "note": None}, headers=admin_headers
    ).json()

    confirm_response = api_client.post(
        "/rsvp/confirm",
        json={
            "attending": True,
            "guests": [
                {
                    "first_name": "Armin",
                    "last_name": "Arlert",
                    "meal_choice": "standard",
                    "intolerance": "none",
                    "is_child": False,
                }
            ],
        },
        headers=user_headers,
    )
    assert confirm_response.status_code == 200

    entries = api_client.get("/admin/rsvp-entries", headers=admin_headers).json()["items"]
    rsvp_id = entries[0]["rsvp_id"]
    assign_response = api_client.patch(
        f"/admin/rsvp/{rsvp_id}/table", json={"table_id": table["id"]}, headers=admin_headers
    )
    assert assign_response.status_code == 200

    delete_response = api_client.delete(f"/admin/tables/{table['id']}", headers=admin_headers)
    assert delete_response.status_code == 409
