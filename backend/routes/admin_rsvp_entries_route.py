from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.admin_rsvp_entries_schema import AdminRsvpEntriesResponse, AdminRsvpEntryFilter
from services.admin_rsvp_entries_service import list_confirmed_rsvp_entries

router = APIRouter(prefix="/admin")


# Confirmed guests with full per-party detail (names, meals, intolerances,
# children) for the admin dashboard — search, filter and paginate server-side
# since this is the list an admin scrolls through directly.
@router.get("/rsvp-entries", response_model=AdminRsvpEntriesResponse)
def list_admin_rsvp_entries(
    search: Optional[str] = Query(default=None),
    filter: AdminRsvpEntryFilter = Query(default=AdminRsvpEntryFilter.all),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return list_confirmed_rsvp_entries(db, search=search, entry_filter=filter, page=page, page_size=page_size)
