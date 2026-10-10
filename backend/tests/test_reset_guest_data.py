from datetime import datetime

from database.base import SessionLocal
from models.invite_link_model import InviteLink
from models.rsvp_model import RSVP
from models.user_model import User
from scripts.reset_guest_data import reset_guest_data


def _seed(db):
    guest = User(first_name="Ospite", last_name="Prova", email=None, password_hash=None, role="user", created_at=datetime.utcnow())
    db.add(guest)
    db.flush()
    head = InviteLink(token="reset-test", first_name="Ospite", last_name="Prova", created_at=datetime.utcnow(), user_id=guest.id)
    db.add(head)
    db.flush()
    db.add(InviteLink(first_name="Parente", last_name="Prova", head_id=head.id, relation="spouse", created_at=datetime.utcnow()))
    db.add(RSVP(user_id=guest.id, attending=False))
    db.commit()


def test_dry_run_changes_nothing_and_apply_wipes_guests_but_keeps_admins(admin_headers):
    db = SessionLocal()
    try:
        admins_before = db.query(User).filter(User.role == "admin").count()
        _seed(db)

        counts = reset_guest_data(db, apply=False)
        assert counts["invite_links"] == 2 and counts["rsvps"] == 1 and counts["guest_users"] >= 1
        assert db.query(InviteLink).count() == 2

        reset_guest_data(db, apply=True)
        assert db.query(InviteLink).count() == 0
        assert db.query(RSVP).count() == 0
        assert db.query(User).filter(User.role == "user").count() == 0
        assert db.query(User).filter(User.role == "admin").count() == admins_before
    finally:
        db.close()
