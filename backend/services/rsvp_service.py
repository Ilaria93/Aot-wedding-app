from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from models.rsvp_guest_model import RsvpGuest
from models.rsvp_model import RSVP
from models.user_model import User
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest, RsvpSubmitResponse
from schemas.rsvp_enums import IntoleranceEnum, MealChoiceEnum
from schemas.rsvp_lookup_schema import RsvpGuestResponse, RsvpMeResponse
from services.rsvp_faction_service import pick_balanced_faction
from settings import is_rsvp_editable


class RsvpValidationError(Exception):
    """Raised when RSVP payload or state is invalid."""


class RsvpConflictError(Exception):
    """Raised when the user already submitted an RSVP on create."""


class RsvpDeadlineError(Exception):
    """Raised when RSVP edits are no longer allowed."""


class RsvpNotFoundError(Exception):
    """Raised when no RSVP exists for update."""


def format_user_full_name(user: User) -> str:
    return f"{user.first_name} {user.last_name}".strip()


def assert_rsvp_editable_window() -> None:
    if not is_rsvp_editable(datetime.now(tz=ZoneInfo("Europe/Rome"))):
        raise RsvpDeadlineError("RSVP can no longer be modified.")


def _guest_models_from_payload(rsvp_id: int, payload: RSVPSubmitRequest) -> list[RsvpGuest]:
    return [
        RsvpGuest(
            rsvp_id=rsvp_id,
            first_name=line.first_name,
            last_name=line.last_name,
            meal_choice=line.meal_choice.value,
            intolerance=line.intolerance.value,
            dietary_notes=line.dietary_notes,
            sort_order=index,
        )
        for index, line in enumerate(payload.guests)
    ]


def _guest_responses(guests: list[RsvpGuest]) -> list[RsvpGuestResponse]:
    return [
        RsvpGuestResponse(
            first_name=guest.first_name,
            last_name=guest.last_name,
            meal_choice=MealChoiceEnum(guest.meal_choice),
            intolerance=IntoleranceEnum(guest.intolerance),
            dietary_notes=guest.dietary_notes,
        )
        for guest in guests
    ]


def _apply_rsvp_payload(
    db: Session,
    rsvp: RSVP,
    user: User,
    payload: RSVPSubmitRequest,
) -> RsvpSubmitResponse:
    rsvp.attending = payload.attending
    rsvp.guests.clear()

    if payload.attending:
        rsvp.faction = pick_balanced_faction(db, exclude_rsvp_id=rsvp.id)
        for guest in _guest_models_from_payload(rsvp.id, payload):
            rsvp.guests.append(guest)
    else:
        rsvp.faction = None

    db.commit()
    db.refresh(rsvp)

    return RsvpSubmitResponse(
        ok=True,
        user=format_user_full_name(user),
        faction=rsvp.faction,
        guest_count=len(rsvp.guests),
    )


def get_rsvp_for_user(db: Session, user: User) -> RsvpMeResponse:
    rsvp_record = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    editable = is_rsvp_editable(datetime.now(tz=ZoneInfo("Europe/Rome")))
    if not rsvp_record:
        return RsvpMeResponse(has_rsvp=False, editable=editable)

    return RsvpMeResponse(
        has_rsvp=True,
        attending=rsvp_record.attending,
        faction=rsvp_record.faction,
        guests=_guest_responses(list(rsvp_record.guests)),
        editable=editable,
    )


def confirm_rsvp_for_user(db: Session, user: User, payload: RSVPSubmitRequest) -> RsvpSubmitResponse:
    assert_rsvp_editable_window()

    existing = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    if existing:
        raise RsvpConflictError("RSVP already submitted")

    rsvp = RSVP(user_id=user.id, attending=payload.attending, faction=None)
    db.add(rsvp)
    db.flush()

    response = _apply_rsvp_payload(db, rsvp, user, payload)
    return response


def update_rsvp_for_user(db: Session, user: User, payload: RSVPSubmitRequest) -> RsvpSubmitResponse:
    assert_rsvp_editable_window()

    rsvp = db.query(RSVP).filter(RSVP.user_id == user.id).first()
    if not rsvp:
        raise RsvpNotFoundError("RSVP not found")

    return _apply_rsvp_payload(db, rsvp, user, payload)
