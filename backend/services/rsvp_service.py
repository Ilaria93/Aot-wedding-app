from sqlalchemy.orm import Session

from models.rsvp_model import RSVP
from models.user_model import User
from schemas.rsvp_confirmation_schema import RSVPConfirmRequest
from schemas.rsvp_lookup_schema import RsvpMeResponse


class RsvpValidationError(Exception):
    """Raised when RSVP payload or state is invalid."""


class RsvpConflictError(Exception):
    """Raised when the user already submitted an RSVP."""


def format_user_full_name(user: User) -> str:
    return f"{user.first_name} {user.last_name}".strip()


def get_rsvp_for_user(db: Session, user: User) -> RsvpMeResponse:
    rsvp_record = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    if not rsvp_record:
        return RsvpMeResponse(has_rsvp=False)

    return RsvpMeResponse(
        has_rsvp=True,
        attending=rsvp_record.attending,
        faction=rsvp_record.faction or None,
        dietary_notes=rsvp_record.dietary_notes,
    )


def confirm_rsvp_for_user(db: Session, user: User, payload: RSVPConfirmRequest) -> dict:
    existing = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    if existing:
        raise RsvpConflictError("RSVP already submitted")

    faction_value = "" if not payload.attending or payload.faction is None else payload.faction.value
    rsvp = RSVP(
        user_id=user.id,
        attending=payload.attending,
        faction=faction_value,
        dietary_notes=payload.dietary_notes,
    )
    db.add(rsvp)
    db.commit()

    return {
        "ok": True,
        "user": format_user_full_name(user),
        "faction": payload.faction if payload.attending else None,
    }
