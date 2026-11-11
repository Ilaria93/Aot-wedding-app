from __future__ import annotations


def _table(api_client, label="Tavolo 1", capacity=10):
    return api_client.post("/admin/tables", json={"label": label, "capacity": capacity}).json()["id"]


def _staff(api_client, **fields):
    payload = {"name": "Marco", "role": "Fotografo"}
    payload.update(fields)
    return api_client.post("/admin/staff-guests", json=payload)


def test_requires_admin(api_client, user_headers):
    assert api_client.get("/admin/staff-guests", headers=user_headers).status_code == 403
    assert api_client.post("/admin/staff-guests", json={"name": "X"}, headers=user_headers).status_code == 403


def test_create_list_update_delete(api_client, admin_headers):
    created = _staff(api_client)
    assert created.status_code == 201
    guest = created.json()
    assert guest["name"] == "Marco"
    assert guest["role"] == "Fotografo"
    assert guest["meal_choice"] == "standard"
    assert guest["intolerance"] == "none"
    assert guest["table_id"] is None

    assert [item["id"] for item in api_client.get("/admin/staff-guests").json()] == [guest["id"]]

    updated = api_client.patch(
        f"/admin/staff-guests/{guest['id']}",
        json={"meal_choice": "vegetarian", "intolerance": "nuts", "dietary_notes": "  niente arachidi  "},
    )
    assert updated.status_code == 200
    assert updated.json()["meal_choice"] == "vegetarian"
    assert updated.json()["dietary_notes"] == "niente arachidi"
    assert updated.json()["name"] == "Marco"

    assert api_client.delete(f"/admin/staff-guests/{guest['id']}").status_code == 204
    assert api_client.get("/admin/staff-guests").json() == []


def test_validation(api_client, admin_headers):
    assert _staff(api_client, name="   ").status_code == 422
    assert _staff(api_client, meal_choice="steak").status_code == 422
    assert _staff(api_client, intolerance="bad").status_code == 422
    guest_id = _staff(api_client).json()["id"]
    assert api_client.patch(f"/admin/staff-guests/{guest_id}", json={"name": ""}).status_code == 422
    assert api_client.patch(f"/admin/staff-guests/{guest_id}", json={"meal_choice": None}).status_code == 422
    assert api_client.patch("/admin/staff-guests/9999", json={"name": "X"}).status_code == 404
    assert api_client.delete("/admin/staff-guests/9999").status_code == 404


def test_table_assignment(api_client, admin_headers):
    table_id = _table(api_client, "Tavolo fornitori")
    guest = _staff(api_client, table_id=table_id).json()
    assert guest["table_id"] == table_id
    assert guest["table_label"] == "Tavolo fornitori"

    assert api_client.patch(f"/admin/staff-guests/{guest['id']}", json={"table_id": None}).json()["table_id"] is None
    assert _staff(api_client, table_id=9999).status_code == 404
    assert api_client.patch(f"/admin/staff-guests/{guest['id']}", json={"table_id": 9999}).status_code == 404


def test_table_with_staff_cannot_be_deleted(api_client, admin_headers):
    table_id = _table(api_client)
    guest = _staff(api_client, table_id=table_id).json()
    assert api_client.delete(f"/admin/tables/{table_id}").status_code == 409

    api_client.patch(f"/admin/staff-guests/{guest['id']}", json={"table_id": None})
    assert api_client.delete(f"/admin/tables/{table_id}").status_code == 204


def test_stats_add_staff_to_the_meals(api_client, admin_headers):
    empty = api_client.get("/admin/rsvp-stats").json()
    assert empty["staff_count"] == 0
    assert empty["meals_total"] == 0
    assert empty["meals_by_choice"] == {}

    _staff(api_client, name="Chitarrista", role="Band")
    _staff(api_client, name="Batterista", role="Band", meal_choice="vegetarian")
    _staff(api_client, name="Fotografo", meal_choice="vegetarian")

    stats = api_client.get("/admin/rsvp-stats").json()
    assert stats["staff_count"] == 3
    assert stats["meals_total"] == 3
    assert stats["meals_by_choice"] == {"standard": 1, "vegetarian": 2}
    # The guests-only breakdown is untouched.
    assert stats["by_meal_choice"] == {}
    assert stats["total_participants"] == 0
