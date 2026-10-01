from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.invite_request_schema import (
    ApproveInviteRequestResponse,
    InviteRequestResponse,
    PendingCountResponse,
)
from services.invite_request_service import (
    InviteRequestNotFoundError,
    approve_invite_request,
    count_pending_requests,
    list_invite_requests,
    reject_invite_request,
)

router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin_user)])


@router.get("/invite-requests", response_model=list[InviteRequestResponse])
def list_requests(
    status: Optional[Literal["pending", "approved", "rejected"]] = None,
    db: Session = Depends(get_db),
):
    return list_invite_requests(db, status)


# Feeds the badge on the admin "Inviti" menu entry.
@router.get("/invite-requests/pending-count", response_model=PendingCountResponse)
def pending_count(db: Session = Depends(get_db)):
    return PendingCountResponse(pending=count_pending_requests(db))


@router.post("/invite-requests/{request_id}/approve", response_model=ApproveInviteRequestResponse)
def approve_request(request_id: int, db: Session = Depends(get_db)):
    try:
        return approve_invite_request(db, request_id)
    except InviteRequestNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/invite-requests/{request_id}/reject", response_model=InviteRequestResponse)
def reject_request(request_id: int, db: Session = Depends(get_db)):
    try:
        return reject_invite_request(db, request_id)
    except InviteRequestNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
