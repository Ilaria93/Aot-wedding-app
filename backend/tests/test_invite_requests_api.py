from datetime import datetime

import pytest

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.invite_request_model import InviteRequest
from routes import invite_request_route

ACCEPTED_BODY = {"status": "received"}


@pytest.fixture(autouse=True)
def no_telegram_and_fresh_limits(monkeypatch):
    sent = []
    monkeypatch.setattr(invite_request_route, "notify_new_invite_request", lambda *a: sent.append(a))
    invite_request_route.phone_limiter.reset()
    invite_request_route.ip_limiter.reset()
    return sent


def _payload(**overrides):
    return {"first_name": "Mario", "last_name": "Rossi", "phone": "333 1234567", "website": "", **overrides}


def _requests():
    db = SessionLocal()
    rows = db.query(InviteRequest).all()
    db.close()
    return rows


def test_saves_pending_request_with_normalised_phone(api_client, no_telegram_and_fresh_limits):
    response = api_client.post("/invite-requests", json=_payload())
    assert response.status_code == 202
    assert response.json() == ACCEPTED_BODY
    [row] = _requests()
    assert (row.first_name, row.last_name, row.phone, row.status) == ("Mario", "Rossi", "+393331234567", "pending")
    assert no_telegram_and_fresh_limits == [("Mario", "Rossi", "+393331234567", "🆕 Non è ancora in tabella.")]


def test_same_answer_when_phone_already_has_invite(api_client):
    db = SessionLocal()
    db.add(InviteLink(token="t1", first_name="Mario", last_name="Rossi", phone="+393331234567", created_at=datetime.utcnow()))
    db.commit()
    db.close()
    response = api_client.post("/invite-requests", json=_payload())
    assert response.status_code == 202
    assert response.json() == ACCEPTED_BODY


def test_honeypot_is_accepted_but_not_saved(api_client, no_telegram_and_fresh_limits):
    response = api_client.post("/invite-requests", json=_payload(website="http://spam"))
    assert response.status_code == 202
    assert response.json() == ACCEPTED_BODY
    assert _requests() == []
    assert no_telegram_and_fresh_limits == []


def test_invalid_phone_is_422(api_client):
    response = api_client.post("/invite-requests", json=_payload(phone="12"))
    assert response.status_code == 422


def test_blank_names_are_422(api_client):
    response = api_client.post("/invite-requests", json=_payload(first_name="  "))
    assert response.status_code == 422


def test_fourth_request_for_same_phone_in_an_hour_is_429(api_client):
    statuses = [api_client.post("/invite-requests", json=_payload()).status_code for _ in range(4)]
    assert statuses == [202, 202, 202, 429]


def test_eleventh_request_from_same_ip_in_an_hour_is_429(api_client):
    statuses = [
        api_client.post("/invite-requests", json=_payload(phone=f"333 12345{n:02d}")).status_code
        for n in range(11)
    ]
    assert statuses[:10] == [202] * 10
    assert statuses[10] == 429


def test_oversized_phone_is_422(api_client):
    response = api_client.post("/invite-requests", json=_payload(phone="1" * 41))
    assert response.status_code == 422


def test_telegram_message_says_when_the_requester_is_already_in_the_table(api_client, no_telegram_and_fresh_limits):
    db = SessionLocal()
    head = InviteLink(token="t1", first_name="Christian", last_name="Rossi", created_at=datetime.utcnow())
    db.add(head)
    db.flush()
    db.add(InviteLink(head_id=head.id, relation="spouse", first_name="Arianna", last_name="Rossi", phone="+393331234567", created_at=datetime.utcnow()))
    db.commit()
    db.close()

    api_client.post("/invite-requests", json=_payload(first_name="Arianna"))

    [(_, _, _, table_status)] = no_telegram_and_fresh_limits
    assert "coniuge di Christian Rossi" in table_status
    assert "non ancora inviato" in table_status
