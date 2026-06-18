from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_current_user
from models.user_model import User
from schemas.rsvp_confirmation_schema import RSVPConfirmRequest
from schemas.rsvp_lookup_schema import RsvpMeResponse
from services.rsvp_service import RsvpConflictError, confirm_rsvp_for_user, get_rsvp_for_user

router = APIRouter(prefix="/rsvp")


# Returns RSVP status for the currently authenticated user.
@router.get("/me", response_model=RsvpMeResponse)
def get_current_user_rsvp(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    return get_rsvp_for_user(db, current_user)


# Saves one RSVP confirmation for the logged-in user.
@router.post("/confirm")
def confirm_rsvp_submission(
    payload: RSVPConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
):
    try:
        return confirm_rsvp_for_user(db, current_user, payload)
    except RsvpConflictError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
