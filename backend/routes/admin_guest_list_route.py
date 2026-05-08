from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.admin_guest_list_schema import AdminGuestListItem
from services.admin_guest_query_service import get_all_guests_with_rsvp_status

router = APIRouter(prefix="/admin")


# Returns all invited guests with their RSVP status.
@router.get("/guests", response_model=list[AdminGuestListItem])
def list_all_guests(db: Session = Depends(get_db)):
    return get_all_guests_with_rsvp_status(db)