from datetime import datetime
from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.rsvp_model import RSVP
from models.refresh_token_session_model import RefreshTokenSession
from models.user_model import User


def _add_invite(token="tok-existing", phone="+393331234567", first_name="Mario"):
    db = SessionLocal()
    row = InviteLink(token=token, first_name=first_name, last_name="Rossi", phone=phone, created_at=datetime.utcnow())
    db.add(row)
    db.commit()
    db.refresh(row)
    db.close()
    return row.id


def test_requires_admin(api_client, user_headers):
    assert api_client.get("/admin/invites").status_code == 403


def _answer(invite_id, attending):
    db = SessionLocal()
    user = User(first_name="Mario", last_name="Rossi", email=None, password_hash=None, role="user", created_at=datetime.utcnow())
    db.add(user)
    db.flush()
    db.query(InviteLink).filter(InviteLink.id == invite_id).update({"user_id": user.id})
    db.add(RSVP(user_id=user.id, attending=attending, faction=None))
    db.commit()
    db.close()


def test_lists_invites_with_status_and_whatsapp_link(api_client, admin_headers):
    invite_id = _add_invite()
    [row] = api_client.get("/admin/invites").json()
    assert row["id"] == invite_id
    assert row["answer"] == "none"
    assert row["sent_at"] is None
    assert row["whatsapp_url"].startswith("https://wa.me/393331234567?text=")


def test_filters_and_search(api_client, admin_headers):
    to_send = _add_invite(token="a", phone="+393330000001", first_name="Anna")
    sent = _add_invite(token="b", phone="+393330000002", first_name="Bruno")
    answered = _add_invite(token="c", phone="+393330000003", first_name="Carla")
    api_client.post(f"/admin/invites/{sent}/mark-sent")
    _answer(answered, attending=True)

    ids = lambda q: [row["id"] for row in api_client.get(f"/admin/invites{q}").json()]
    assert ids("?filter=to_send") == [to_send, answered]
    assert ids("?filter=sent") == [sent]
    assert ids("?filter=answered") == [answered]
    assert ids("?search=brun") == [sent]
    assert ids("?search=0000003") == [answered]


def test_answer_reflects_declined(api_client, admin_headers):
    invite_id = _add_invite()
    _answer(invite_id, attending=False)
    assert api_client.get("/admin/invites").json()[0]["answer"] == "declined"


def test_mark_sent_sets_timestamp(api_client, admin_headers):
    invite_id = _add_invite()
    response = api_client.post(f"/admin/invites/{invite_id}/mark-sent")
    assert response.status_code == 200
    assert response.json()["sent_at"] is not None
    assert api_client.post("/admin/invites/999/mark-sent").status_code == 404


def test_mark_sent_twice_keeps_first_timestamp(api_client, admin_headers):
    invite_id = _add_invite()
    first = api_client.post(f"/admin/invites/{invite_id}/mark-sent").json()["sent_at"]
    second = api_client.post(f"/admin/invites/{invite_id}/mark-sent").json()["sent_at"]
    assert first is not None
    assert second == first


def test_delete_removes_head_and_group(api_client, admin_headers):
    head_id = _add_invite(token="del-head")
    db = SessionLocal()
    db.add(InviteLink(first_name="Giulia", last_name="Rossi", head_id=head_id, relation="spouse", created_at=datetime.utcnow()))
    db.commit()
    db.close()

    assert api_client.delete(f"/admin/invites/{head_id}").status_code == 204
    assert api_client.get("/admin/invites").json() == []
    db = SessionLocal()
    assert db.query(InviteLink).count() == 0
    db.close()


def test_delete_also_removes_the_answer_and_guest_account(api_client, admin_headers):
    invite_id = _add_invite(token="del-answered")
    _answer(invite_id, attending=True)
    db = SessionLocal()
    guest_id = db.query(InviteLink).filter(InviteLink.id == invite_id).one().user_id
    db.add(
        RefreshTokenSession(
            user_id=guest_id,
            jti="guest-session",
            refresh_token_hash="x",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow(),
        )
    )
    db.commit()
    db.close()

    assert api_client.delete(f"/admin/invites/{invite_id}").status_code == 204
    db = SessionLocal()
    assert db.query(RSVP).count() == 0
    assert db.query(User).filter(User.id == guest_id).count() == 0
    assert db.query(RefreshTokenSession).filter(RefreshTokenSession.user_id == guest_id).count() == 0
    # The admin's own session and account are untouched.
    assert db.query(User).filter(User.role == "admin").count() == 1
    db.close()


def test_delete_unknown_invite_is_404(api_client, admin_headers):
    assert api_client.delete("/admin/invites/999999").status_code == 404


def test_delete_requires_admin(api_client, user_headers):
    assert api_client.delete("/admin/invites/1").status_code == 403
