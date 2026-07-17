def test_admin_user_list_shows_only_admin_on_fresh_db(api_client, admin_headers):
    response = api_client.get("/admin/users", headers=admin_headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 1
    assert users[0]["role"] == "admin"


def test_admin_user_list_shows_registered_users(api_client, admin_headers, user_headers):
    _ = user_headers
    response = api_client.get("/admin/users", headers=admin_headers)
    assert response.status_code == 200

    users = response.json()
    assert len(users) == 2
    user_row = next(user for user in users if user["email"] == "user@test.app")
    assert user_row["has_rsvp"] is False


def test_admin_user_list_shows_user_with_confirmed_rsvp(api_client, admin_headers, user_headers):
    api_client.post(
        "/rsvp/confirm",
        headers=user_headers,
        json={
            "attending": True,
            "guests": [
                {
                    "first_name": "Mario",
                    "last_name": "Rossi",
                    "meal_choice": "standard",
                    "intolerance": "none",
                }
            ],
        },
    )

    response = api_client.get("/admin/users", headers=admin_headers)
    users = response.json()
    user_row = next(user for user in users if user["email"] == "user@test.app")
    assert user_row["has_rsvp"] is True
    assert user_row["attending"] is True
    assert user_row["faction"] == "scout_regiment"
