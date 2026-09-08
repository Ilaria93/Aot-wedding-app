from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from constants.rsvp_party import MAX_PARTY_GUESTS, MIN_PARTY_GUESTS
from database.base import get_db
from schemas.invite_link_schema import InviteLinkResponse
from services.invite_link_service import get_invite_by_token

router = APIRouter(prefix="/invites")


# Resolves a WhatsApp invite token to the guest's name and party size for the
# envelope/RSVP pages. Public and read-only — no session, no auth, nothing
# else about the guest (phone, bound account) is exposed here.
@router.get("/{token}", response_model=InviteLinkResponse)
def read_invite(token: str, db: Session = Depends(get_db)):
    invite = get_invite_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    return InviteLinkResponse(
        first_name=invite.first_name,
        last_name=invite.last_name,
        min_party_guests=MIN_PARTY_GUESTS,
        max_party_guests=invite.party_size or MAX_PARTY_GUESTS,
    )
