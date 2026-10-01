from datetime import datetime
from urllib.parse import parse_qs, urlparse

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.invite_request_model import InviteRequest


def _add_request(first_name="Mario", phone="+393331234567", status="pending"):
    db = SessionLocal()
    row = InviteRequest(first_name=first_name, last_name="Rossi", phone=phone, status=status, created_at=datetime.utcnow())
    db.add(row)
    db.commit()
    db.refresh(row)
    db.close()
    return row.id


def _add_invite(token="tok-existing", phone="+393331234567", first_name="Mario"):
    db = SessionLocal()
    row = InviteLink(token=token, first_name=first_name, last_name="Rossi", phone=phone, created_at=datetime.utcnow())
    db.add(row)
    db.commit()
    db.refresh(row)
    db.close()
    return row.id


def test_requires_admin(api_client, user_headers):
    assert api_client.get("/admin/invite-requests").status_code == 403


def test_lists_pending_requests_with_existing_invite_hint(api_client, admin_headers):
    _add_request()
    _add_request(first_name="Luca", phone="+393339999999", status="rejected")
    invite_id = _add_invite()

    response = api_client.get("/admin/invite-requests?status=pending")
    assert response.status_code == 200
    [row] = response.json()
    assert row["first_name"] == "Mario"
    assert row["existing_invite"]["id"] == invite_id


def test_pending_count(api_client, admin_headers):
    _add_request()
    _add_request(phone="+393330000000")
    _add_request(phone="+393331111111", status="approved")
    assert api_client.get("/admin/invite-requests/pending-count").json() == {"pending": 2}


def test_approve_creates_invite_and_returns_whatsapp_link(api_client, admin_headers, monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://site")
    request_id = _add_request()

    response = api_client.post(f"/admin/invite-requests/{request_id}/approve")
    assert response.status_code == 200
    body = response.json()
    assert body["invite_url"].startswith("https://site/invito/")
    parsed = urlparse(body["whatsapp_url"])
    assert parsed.path == "/393331234567"
    assert body["invite_url"] in parse_qs(parsed.query)["text"][0]

    db = SessionLocal()
    request = db.query(InviteRequest).get(request_id)
    invite = db.query(InviteLink).get(body["invite_link_id"])
    db.close()
    assert request.status == "approved" and request.invite_link_id == invite.id and request.decided_at
    assert (invite.first_name, invite.phone) == ("Mario", "+393331234567")


def test_approve_reuses_existing_invite_for_same_phone(api_client, admin_headers):
    invite_id = _add_invite()
    request_id = _add_request()
    body = api_client.post(f"/admin/invite-requests/{request_id}/approve").json()
    assert body["invite_link_id"] == invite_id
    db = SessionLocal()
    assert db.query(InviteLink).count() == 1
    db.close()


def test_reject_marks_request(api_client, admin_headers):
    request_id = _add_request()
    response = api_client.post(f"/admin/invite-requests/{request_id}/reject")
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_unknown_request_is_404(api_client, admin_headers):
    assert api_client.post("/admin/invite-requests/999/approve").status_code == 404
    assert api_client.post("/admin/invite-requests/999/reject").status_code == 404
