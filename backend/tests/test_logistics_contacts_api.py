def test_public_contacts_are_empty_on_fresh_db(api_client):
    response = api_client.get("/contacts")
    assert response.status_code == 200
    assert response.json() == []


def test_admin_can_create_contact_and_guests_can_view_it(api_client, admin_headers):
    create_response = api_client.post(
        "/admin/contacts",
        headers=admin_headers,
        json={
            "category": "hotel",
            "label": "Hotel Paradis",
            "contact_person": "Front desk",
            "phone": "+39 000 111 222",
            "website": "https://hotel.example.com",
            "address": "Via Mura 12, Ravenna",
            "notes": "Check-in dalle 15:00",
            "sort_order": 2,
            "is_active": True,
        },
    )
    assert create_response.status_code == 200
    assert create_response.json()["label"] == "Hotel Paradis"

    public_response = api_client.get("/contacts")
    assert public_response.status_code == 200
    public_contacts = public_response.json()
    assert len(public_contacts) == 1
    assert public_contacts[0]["category"] == "hotel"
    assert public_contacts[0]["phone"] == "+39 000 111 222"


def test_public_contacts_hide_inactive_items(api_client, admin_headers):
    first_response = api_client.post(
        "/admin/contacts",
        headers=admin_headers,
        json={
            "category": "transfer",
            "label": "Transfer Cerimonia",
            "phone": "+39 333 000 000",
            "sort_order": 1,
            "is_active": True,
        },
    )
    second_response = api_client.post(
        "/admin/contacts",
        headers=admin_headers,
        json={
            "category": "makeup",
            "label": "Truccatrice Sposa",
            "phone": "+39 333 999 999",
            "sort_order": 0,
            "is_active": False,
        },
    )
    assert first_response.status_code == 200
    assert second_response.status_code == 200

    public_response = api_client.get("/contacts")
    assert public_response.status_code == 200
    public_contacts = public_response.json()
    assert len(public_contacts) == 1
    assert public_contacts[0]["label"] == "Transfer Cerimonia"


def test_admin_can_update_and_delete_contacts(api_client, admin_headers):
    create_response = api_client.post(
        "/admin/contacts",
        headers=admin_headers,
        json={
            "category": "laundry",
            "label": "Stireria Centro",
            "phone": "+39 051 123 456",
            "sort_order": 3,
            "is_active": True,
        },
    )
    contact_id = create_response.json()["id"]

    update_response = api_client.patch(
        f"/admin/contacts/{contact_id}",
        headers=admin_headers,
        json={
            "notes": "Consegna express disponibile",
            "is_active": False,
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["notes"] == "Consegna express disponibile"
    assert update_response.json()["is_active"] is False

    public_response = api_client.get("/contacts")
    assert public_response.status_code == 200
    assert public_response.json() == []

    delete_response = api_client.delete(f"/admin/contacts/{contact_id}", headers=admin_headers)
    assert delete_response.status_code == 204

    admin_list_response = api_client.get("/admin/contacts", headers=admin_headers)
    assert admin_list_response.status_code == 200
    assert admin_list_response.json() == []
