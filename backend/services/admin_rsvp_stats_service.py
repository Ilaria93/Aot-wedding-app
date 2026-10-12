from sqlalchemy import func
from sqlalchemy.orm import Session

from constants.rsvp_party import MAX_PARTY_GUESTS
from models.rsvp_guest_model import RsvpGuest
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.auth_schema import UserRoleEnum
from services.admin_invite_service import list_admin_invites


def _invite_stats(db: Session, attending_persons: int) -> dict:
    """Invites (one per shared group, one per person in an individual group) by state, with the people they
    stand for: the party size the couple set, else the group size. The people who confirmed are the real count."""
    buckets = {name: {"invites": 0, "persons": 0} for name in ("to_send", "waiting", "attending", "declined")}
    total = 0
    for invite in list_admin_invites(db, None, None):
        if invite.individual:
            units = [(invite.own_sent_at, invite.answer)] + [(m.sent_at, m.answer) for m in invite.members]
            persons = 1
        else:
            units = [(invite.sent_at, invite.answer)]
            persons = min(invite.party_size or 1 + len(invite.members), MAX_PARTY_GUESTS)
        for sent_at, answer in units:
            name = "attending" if answer == "attending" else "declined" if answer == "declined" else "waiting" if sent_at else "to_send"
            buckets[name]["invites"] += 1
            buckets[name]["persons"] += persons
            total += 1
    buckets["attending"]["persons"] = attending_persons
    return {"total": total, **buckets}


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
        "invites": _invite_stats(db, int(total_participants)),
        "by_faction": by_faction,
        "by_meal_choice": by_meal_choice,
    }
