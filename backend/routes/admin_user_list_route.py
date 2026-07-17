from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.admin_rsvp_stats_schema import AdminRsvpStatsResponse
from schemas.admin_user_list_schema import AdminUserListItem
from services.admin_rsvp_stats_service import compute_rsvp_stats
from services.admin_user_query_service import get_all_users_with_rsvp_status

router = APIRouter(prefix="/admin")


# Returns all registered users with their RSVP status.
@router.get("/users", response_model=list[AdminUserListItem])
def list_all_users(db: Session = Depends(get_db), _admin_ok=Depends(require_admin_user)):
    return get_all_users_with_rsvp_status(db)


# Returns aggregated RSVP statistics for the admin dashboard.
@router.get("/rsvp-stats", response_model=AdminRsvpStatsResponse)
def get_rsvp_stats(db: Session = Depends(get_db), _admin_ok=Depends(require_admin_user)):
    return compute_rsvp_stats(db)
