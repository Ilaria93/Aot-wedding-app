from sqlalchemy.orm import Session

from models.rsvp_model import RSVP
from models.user_model import User
from schemas.auth_schema import UserRoleEnum


def compute_rsvp_stats(db: Session) -> dict:
    total_users = db.query(User).filter(User.role == UserRoleEnum.user.value).count()
    all_rsvps = db.query(RSVP).all()
    total_confirmed = len(all_rsvps)
    total_attending = sum(1 for rsvp in all_rsvps if rsvp.attending)
    total_not_attending = sum(1 for rsvp in all_rsvps if not rsvp.attending)

    by_faction: dict[str, int] = {}
    for rsvp in all_rsvps:
        if rsvp.attending and rsvp.faction:
            by_faction[rsvp.faction] = by_faction.get(rsvp.faction, 0) + 1

    return {
        "total_users": total_users,
        "total_confirmed": total_confirmed,
        "total_attending": total_attending,
        "total_not_attending": total_not_attending,
        "by_faction": by_faction,
    }
