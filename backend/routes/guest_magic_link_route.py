from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.auth_schema import AuthSessionResponse
from schemas.guest_access_schema import GuestMagicLinkRequest, GuestMagicLinkRequestResponse
from services.guest_access_service import (
    GuestMagicLinkInvalidError,
    request_guest_magic_link,
    verify_guest_magic_link,
)

router = APIRouter(prefix="/auth/guest-magic-link")


# Always returns 200 regardless of whether the email matches a guest — the
# alternative (404 for "not found") would let anyone probe the guest list.
@router.post("/request", response_model=GuestMagicLinkRequestResponse)
def request_magic_link(payload: GuestMagicLinkRequest, db: Session = Depends(get_db)):
    request_guest_magic_link(db, payload.email)
    return GuestMagicLinkRequestResponse()


@router.get("/verify", response_model=AuthSessionResponse)
def verify_magic_link(token: str = Query(...), db: Session = Depends(get_db)):
    try:
        return verify_guest_magic_link(db, token)
    except GuestMagicLinkInvalidError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
