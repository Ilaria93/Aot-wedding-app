from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.guest_access_schema import GuestRsvpConfirmResponse
from schemas.rsvp_confirmation_schema import RSVPSubmitRequest
from services.auth_cookie_service import set_auth_cookies
from services.guest_access_service import GuestInviteNotFoundError, confirm_guest_rsvp
from services.rsvp_service import RsvpDeadlineError

router = APIRouter(prefix="/invites")


# Public: confirms/updates an RSVP directly from the WhatsApp invite token,
# creating a passwordless guest account behind the scenes on first use. The
# session goes in httpOnly cookies, same as the admin login.
@router.post("/{token}/rsvp", response_model=GuestRsvpConfirmResponse)
def confirm_rsvp_via_invite(
    token: str,
    payload: RSVPSubmitRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    try:
        session, rsvp = confirm_guest_rsvp(db, token, payload)
    except GuestInviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except RsvpDeadlineError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    set_auth_cookies(response, session)
    return GuestRsvpConfirmResponse(user=session.user, rsvp=rsvp)
