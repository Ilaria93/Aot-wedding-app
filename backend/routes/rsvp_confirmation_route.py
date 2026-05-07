from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from models.rsvp_model import RSVP
from schemas.rsvp_confirmation_schema import RSVPConfirmRequest
from services.guest_lookup_service import get_guest_by_token

router = APIRouter(prefix="/rsvp")


# Saves one RSVP confirmation for the invited guest.
@router.post("/confirm")
def confirm(payload: RSVPConfirmRequest, db: Session = Depends(get_db)):
    guest = get_guest_by_token(db, payload.invitation_token)
    if not guest:
        raise HTTPException(status_code=404, detail="Invitation token not found")

    existing = db.query(RSVP).filter(RSVP.guest_id == guest.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="RSVP already submitted")

    rsvp = RSVP(
        guest_id=guest.id,
        attending=payload.attending,
        faction=payload.faction.value,
        dietary_notes=payload.dietary_notes,
    )
    db.add(rsvp)
    db.commit()

    return {"ok": True, "guest": guest.full_name, "faction": payload.faction}
