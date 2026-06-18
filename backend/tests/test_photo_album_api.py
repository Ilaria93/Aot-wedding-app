def _current_user_id(api_client, headers):
    response = api_client.get("/auth/me", headers=headers)
    return response.json()["id"]


def test_public_photo_album_is_empty_on_fresh_db(api_client):
    response = api_client.get("/photos")
    assert response.status_code == 200
    assert response.json() == []


def test_photo_upload_intent_requires_login(api_client):
    response = api_client.post(
        "/photos/upload-intent",
        json={
            "original_filename": "friends.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 2048,
        },
    )
    assert response.status_code == 401


def test_photo_upload_intent_returns_signed_upload_data(api_client, user_headers):
    user_id = _current_user_id(api_client, user_headers)

    response = api_client.post(
        "/photos/upload-intent",
        headers=user_headers,
        json={
            "original_filename": "squad-photo.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 4096,
        },
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["upload_method"] == "PUT"
    assert payload["storage_key"].startswith(f"wedding-album/{user_id}/")
    assert payload["upload_url"]


def test_photo_is_visible_immediately_after_upload(api_client, user_headers):
    upload_intent_response = api_client.post(
        "/photos/upload-intent",
        headers=user_headers,
        json={
            "original_filename": "ceremony.png",
            "mime_type": "image/png",
            "file_size_bytes": 5120,
        },
    )
    storage_key = upload_intent_response.json()["storage_key"]

    complete_response = api_client.post(
        "/photos/complete-upload",
        headers=user_headers,
        json={
            "storage_key": storage_key,
            "original_filename": "ceremony.png",
            "mime_type": "image/png",
            "file_size_bytes": 5120,
            "caption": "Ingresso degli invitati",
        },
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "approved"

    public_album = api_client.get("/photos")
    photos = public_album.json()
    assert len(photos) == 1
    assert photos[0]["uploader_name"] == "Guest Tester"
    assert photos[0]["caption"] == "Ingresso degli invitati"


def test_photo_complete_upload_rejects_reused_storage_key(api_client, user_headers):
    upload_intent_response = api_client.post(
        "/photos/upload-intent",
        headers=user_headers,
        json={
            "original_filename": "friends.webp",
            "mime_type": "image/webp",
            "file_size_bytes": 2048,
        },
    )
    storage_key = upload_intent_response.json()["storage_key"]

    first_complete = api_client.post(
        "/photos/complete-upload",
        headers=user_headers,
        json={
            "storage_key": storage_key,
            "original_filename": "friends.webp",
            "mime_type": "image/webp",
            "file_size_bytes": 2048,
        },
    )
    assert first_complete.status_code == 200

    second_complete = api_client.post(
        "/photos/complete-upload",
        headers=user_headers,
        json={
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
            "storage_key": "wedding-album/1/fake.jpg",
            "original_filename": "fake.jpg",
            "mime_type": "image/jpeg",
            "file_size_bytes": 2048,
        },
    )
    assert response.status_code == 401
