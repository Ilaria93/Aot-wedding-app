from sqlalchemy import func
from sqlalchemy.orm import Session

from models.rsvp_guest_model import RsvpGuest
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.auth_schema import UserRoleEnum


def compute_rsvp_stats(db: Session) -> dict:
    total_users = db.query(User).filter(User.role == UserRoleEnum.user.value).count()
    all_rsvps = db.query(RSVP).all()
    total_confirmed = len(all_rsvps)
    total_attending = sum(1 for rsvp in all_rsvps if rsvp.attending)
    total_not_attending = sum(1 for rsvp in all_rsvps if not rsvp.attending)

    total_participants = (
        db.query(func.count(RsvpGuest.id))
        .join(RSVP, RsvpGuest.rsvp_id == RSVP.id)
        .filter(RSVP.attending.is_(True))
        .scalar()
        or 0
    )

    by_faction: dict[str, int] = {}
    faction_rows = (
        db.query(RSVP.faction, func.count(RsvpGuest.id))
        .join(RsvpGuest, RsvpGuest.rsvp_id == RSVP.id)
        .filter(RSVP.attending.is_(True), RSVP.faction.isnot(None))
        .group_by(RSVP.faction)
        .all()
    )
    for faction, count in faction_rows:
        by_faction[faction] = int(count)

    return {
        "total_users": total_users,
        "total_confirmed": total_confirmed,
        "total_attending": total_attending,
        "total_not_attending": total_not_attending,
        "total_participants": int(total_participants),
        "by_faction": by_faction,
    }
