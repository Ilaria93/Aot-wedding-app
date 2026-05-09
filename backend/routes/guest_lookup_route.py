from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies.admin_auth_dependency import require_admin_api_key
from database.base import get_db
from schemas.guest_invitation_schema import (
    GuestInvitationCreateRequest,
    GuestInvitationCreateResponse,
)
from services.guest_lookup_service import create_guest_invitation, get_guest_by_token

router = APIRouter()


# Returns guest info for a single invitation token.
@router.get("/guest/{token}")
def guest_by_token(token: str, db: Session = Depends(get_db)):
    guest = get_guest_by_token(db, token)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return {"full_name": guest.full_name, "invitation_token": guest.invitation_token}


# Creates a new guest invitation with a unique token.
@router.post("/guest/create-invite", response_model=GuestInvitationCreateResponse)
def create_guest_invite(
    payload: GuestInvitationCreateRequest,
    db: Session = Depends(get_db),
    _admin_ok: None = Depends(require_admin_api_key),
):
    normalized_full_name = payload.full_name.strip()
    if not normalized_full_name:
        raise HTTPException(status_code=400, detail="Full name cannot be empty")

    created_guest = create_guest_invitation(db, normalized_full_name)
    return GuestInvitationCreateResponse(
        guest_id=created_guest.id,
        full_name=created_guest.full_name,
        invitation_token=created_guest.invitation_token,
    )
