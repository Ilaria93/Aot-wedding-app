from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.guest_access_schema import GuestRsvpConfirmRequest, GuestRsvpConfirmResponse
from services.guest_access_service import (
    GuestEmailAlreadyInUseError,
    GuestInviteNotFoundError,
    confirm_guest_rsvp,
)
from services.rsvp_service import RsvpDeadlineError

router = APIRouter(prefix="/invites")


# Public: confirms/updates an RSVP directly from the WhatsApp invite token,
# creating a passwordless guest account behind the scenes on first use.
@router.post("/{token}/rsvp", response_model=GuestRsvpConfirmResponse)
def confirm_rsvp_via_invite(
    token: str,
    payload: GuestRsvpConfirmRequest,
    db: Session = Depends(get_db),
):
    try:
        session, rsvp = confirm_guest_rsvp(db, token, payload)
    except GuestInviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except GuestEmailAlreadyInUseError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except RsvpDeadlineError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    return GuestRsvpConfirmResponse(session=session, rsvp=rsvp)
