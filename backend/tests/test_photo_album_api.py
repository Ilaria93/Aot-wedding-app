def test_public_photo_album_is_empty_on_fresh_db(api_client):
    response = api_client.get("/photos")
    assert response.status_code == 200
    assert response.json() == []


def test_photo_upload_intent_requires_login(api_client):
    response = api_client.post(
        "/photos/upload-intent",
        json={
            "invitation_token": "missing-token",
            "original_filename": "friends.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 2048,
        },
    )
    assert response.status_code == 401


def test_photo_upload_intent_requires_valid_invitation_token(api_client, invited_headers):
    response = api_client.post(
        "/photos/upload-intent",
        headers=invited_headers,
        json={
            "invitation_token": "missing-token",
            "original_filename": "friends.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 2048,
        },
    )
    assert response.status_code == 404


def test_photo_upload_intent_returns_signed_upload_data(api_client, admin_headers, invited_headers):
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Jean Kirstein"},
    )
    token = create_response.json()["invitation_token"]
    guest_id = create_response.json()["guest_id"]

    response = api_client.post(
        "/photos/upload-intent",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "original_filename": "squad-photo.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 4096,
        },
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["upload_method"] == "PUT"
    assert payload["upload_headers"]["Content-Type"] == "image/jpeg"
    assert payload["storage_key"].startswith(f"wedding-album/{guest_id}/")
    assert payload["upload_url"]


def test_photo_stays_hidden_until_admin_approves_it(api_client, admin_headers, invited_headers):
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Hange Zoe"},
    )
    token = create_response.json()["invitation_token"]

    upload_intent_response = api_client.post(
        "/photos/upload-intent",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "original_filename": "ceremony.png",
            "mime_type": "image/png",
            "file_size_bytes": 5120,
        },
    )
    storage_key = upload_intent_response.json()["storage_key"]

    complete_response = api_client.post(
        "/photos/complete-upload",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "storage_key": storage_key,
            "original_filename": "ceremony.png",
            "mime_type": "image/png",
            "file_size_bytes": 5120,
            "caption": "Ingresso degli invitati",
        },
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "pending"

    public_before_approval = api_client.get("/photos")
    assert public_before_approval.status_code == 200
    assert public_before_approval.json() == []

    admin_list_response = api_client.get("/admin/photos", headers=admin_headers)
    assert admin_list_response.status_code == 200
    admin_photos = admin_list_response.json()
    assert len(admin_photos) == 1
    assert admin_photos[0]["guest_full_name"] == "Hange Zoe"
    assert admin_photos[0]["status"] == "pending"

    approve_response = api_client.patch(
        f"/admin/photos/{admin_photos[0]['id']}",
        headers=admin_headers,
        json={"status": "approved"},
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"
    assert approve_response.json()["approved_at"] is not None

    public_after_approval = api_client.get("/photos")
    assert public_after_approval.status_code == 200
    approved_photos = public_after_approval.json()
    assert len(approved_photos) == 1
    assert approved_photos[0]["guest_full_name"] == "Hange Zoe"
    assert approved_photos[0]["caption"] == "Ingresso degli invitati"
    assert approved_photos[0]["image_url"].endswith(storage_key)


def test_photo_complete_upload_rejects_reused_storage_key(api_client, admin_headers, invited_headers):
    create_response = api_client.post(
        "/guest/create-invite",
        headers=admin_headers,
        json={"full_name": "Pieck Finger"},
    )
    token = create_response.json()["invitation_token"]

    upload_intent_response = api_client.post(
        "/photos/upload-intent",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "original_filename": "friends.webp",
            "mime_type": "image/webp",
            "file_size_bytes": 2048,
        },
    )
    storage_key = upload_intent_response.json()["storage_key"]

    first_complete = api_client.post(
        "/photos/complete-upload",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "storage_key": storage_key,
            "original_filename": "friends.webp",
            "mime_type": "image/webp",
            "file_size_bytes": 2048,
        },
    )
    assert first_complete.status_code == 200

    second_complete = api_client.post(
        "/photos/complete-upload",
        headers=invited_headers,
        json={
            "invitation_token": token,
            "storage_key": storage_key,
            "original_filename": "friends.webp",
            "mime_type": "image/webp",
            "file_size_bytes": 2048,
        },
    )
    assert second_complete.status_code == 400


def test_photo_complete_upload_requires_login(api_client):
    response = api_client.post(
        "/photos/complete-upload",
        json={
            "invitation_token": "missing-token",
            "storage_key": "wedding-album/1/fake.jpg",
            "original_filename": "fake.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 2048,
        },
    )
    assert response.status_code == 401
