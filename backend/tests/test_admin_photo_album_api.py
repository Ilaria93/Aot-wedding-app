from datetime import datetime

from fastapi.testclient import TestClient

from database.base import SessionLocal
from main import app
from models.user_model import User
from services.auth_token_service import issue_auth_session


def _guest_client() -> TestClient:
    db = SessionLocal()
    user = User(
        first_name="Guest",
        last_name="Tester",
        email=None,
        password_hash=None,
        role="user",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    db = SessionLocal()
    db_user = db.query(User).filter(User.id == user.id).first()
    session = issue_auth_session(db, db_user, remember_me=False)
    db.close()

    client = TestClient(app)
    client.cookies.set("access_token", session.access_token)
    return client


def _upload_and_complete_photo(client: TestClient, filename: str = "party.jpg") -> int:
    intent = client.post(
        "/photos/upload-intent",
        json={"original_filename": filename, "mime_type": "image/jpeg", "file_size_bytes": 2048},
    )
    storage_key = intent.json()["storage_key"]
    complete = client.post(
        "/photos/complete-upload",
        json={
            "storage_key": storage_key,
            "original_filename": filename,
            "mime_type": "image/jpeg",
            "file_size_bytes": 2048,
        },
    )
    return complete.json()["photo_id"]


def test_admin_delete_photo_requires_login(api_client):
    guest_client = _guest_client()
    photo_id = _upload_and_complete_photo(guest_client)

    response = api_client.delete(f"/admin/photos/{photo_id}")
    assert response.status_code == 401


def test_admin_delete_photo_rejects_non_admin(api_client, user_headers):
    guest_client = _guest_client()
    photo_id = _upload_and_complete_photo(guest_client)

    response = api_client.delete(f"/admin/photos/{photo_id}", headers=user_headers)
    assert response.status_code == 403


def test_admin_delete_photo_removes_it_from_the_public_album(api_client, admin_headers, monkeypatch):
    guest_client = _guest_client()
    photo_id = _upload_and_complete_photo(guest_client)

    delete_calls = []

    class FakeS3Client:
        def delete_object(self, **kwargs):
            delete_calls.append(kwargs)

    monkeypatch.setattr("services.photo_album_service._build_s3_client", lambda: FakeS3Client())

    response = api_client.delete(f"/admin/photos/{photo_id}", headers=admin_headers)
    assert response.status_code == 204
    assert len(delete_calls) == 1

    public_album = api_client.get("/photos")
    assert public_album.json() == []


def test_admin_delete_photo_404_for_unknown_id(api_client, admin_headers):
    response = api_client.delete("/admin/photos/999999", headers=admin_headers)
    assert response.status_code == 404
