from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from models.rsvp_model import RSVP
from schemas.rsvp_confirmation_schema import RSVPConfirmRequest
from schemas.rsvp_lookup_schema import RsvpLookupResponse
from services.guest_lookup_service import get_guest_by_token, get_rsvp_by_invitation_token

router = APIRouter(prefix="/rsvp")


def build_stored_faction_value(payload: RSVPConfirmRequest) -> str:
    # Ignores faction when the guest is not attending.
    if not payload.attending or payload.faction is None:
        return ""
    return payload.faction.value


# Saves one RSVP confirmation for the invited guest.
@router.post("/confirm")
def confirm_rsvp_submission(payload: RSVPConfirmRequest, db: Session = Depends(get_db)):
    guest = get_guest_by_token(db, payload.invitation_token)
    if not guest:
        raise HTTPException(status_code=404, detail="Invitation token not found")

    existing = db.query(RSVP).filter(RSVP.guest_id == guest.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="RSVP already submitted")

    rsvp = RSVP(
        guest_id=guest.id,
        attending=payload.attending,
        faction=build_stored_faction_value(payload),
        dietary_notes=payload.dietary_notes,
    )
    db.add(rsvp)
    db.commit()

    return {
        "ok": True,
        "guest": guest.full_name,
        "faction": payload.faction if payload.attending else None,
    }

# Returns RSVP status for a guest token.
@router.get("/by-token/{token}", response_model=RsvpLookupResponse)
def get_rsvp_status_by_token(token: str, db: Session = Depends(get_db)):
    guest, rsvp_record = get_rsvp_by_invitation_token(db, token)

    if not guest:
        raise HTTPException(status_code=404, detail="Invitation token not found")

    if not rsvp_record:
        return RsvpLookupResponse(
            has_rsvp=False,
            guest_full_name=guest.full_name,
        )

    return RsvpLookupResponse(
        has_rsvp=True,
        guest_full_name=guest.full_name,
        attending=rsvp_record.attending,
        faction=rsvp_record.faction or None,
        dietary_notes=rsvp_record.dietary_notes,
    )