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

    by_meal_choice: dict[str, int] = {}
    meal_choice_rows = (
        db.query(RsvpGuest.meal_choice, func.count(RsvpGuest.id))
        .join(RSVP, RsvpGuest.rsvp_id == RSVP.id)
        .filter(RSVP.attending.is_(True))
        .group_by(RsvpGuest.meal_choice)
        .all()
    )
    for meal_choice, count in meal_choice_rows:
        by_meal_choice[meal_choice] = int(count)

    total_children = (
        db.query(func.count(RsvpGuest.id))
        .join(RSVP, RsvpGuest.rsvp_id == RSVP.id)
        .filter(RSVP.attending.is_(True), RsvpGuest.is_child.is_(True))
        .scalar()
        or 0
    )

    return {
        "total_users": total_users,
        "total_confirmed": total_confirmed,
        "total_attending": total_attending,
        "total_not_attending": total_not_attending,
        "total_participants": int(total_participants),
        "total_children": int(total_children),
        "by_faction": by_faction,
        "by_meal_choice": by_meal_choice,
    }
