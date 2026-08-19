from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.invite_link_schema import InviteLinkResponse
from services.invite_link_service import get_invite_by_token

router = APIRouter(prefix="/invites")


# Resolves a WhatsApp invite token to the guest's name for the envelope
# page. Public and read-only — no session, no auth, nothing else about the
# guest is exposed here.
@router.get("/{token}", response_model=InviteLinkResponse)
def read_invite(token: str, db: Session = Depends(get_db)):
    invite = get_invite_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    return invite
