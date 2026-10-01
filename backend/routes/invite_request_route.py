from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.invite_request_schema import InviteRequestAccepted, InviteRequestCreate
from services.admin_invite_service import find_matches
from services.invite_request_service import create_invite_request
from services.phone_service import InvalidPhoneError, normalize_phone
from services.rate_limit_service import SlidingWindowLimiter
from services.telegram_notify_service import describe_matches, notify_new_invite_request

router = APIRouter(prefix="/invite-requests")

HOUR = 3600
phone_limiter = SlidingWindowLimiter(limit=3, window_seconds=HOUR)
ip_limiter = SlidingWindowLimiter(limit=10, window_seconds=HOUR)


def _client_ip(request: Request) -> str:
    # ponytail: first X-Forwarded-For entry is client-supplied, so a bot can rotate it
    # past the per-IP limit; accepted because the right-most entry may be the
    # platform proxy (one shared bucket would block real guests). The per-phone
    # limit still holds and spam only yields pending requests the couple rejects.
    # Trust a fixed proxy depth if spam ever shows up.
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Public: a guest without their WhatsApp link asks the couple for it. The
# answer is identical whether or not the phone already has an invite, so the
# site never reveals who is on the guest list.
@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=InviteRequestAccepted)
def request_invite(
    payload: InviteRequestCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if payload.website.strip():
        return InviteRequestAccepted()

    try:
        phone = normalize_phone(payload.phone)
    except InvalidPhoneError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    if not ip_limiter.hit(_client_ip(request)) or not phone_limiter.hit(phone):
        raise HTTPException(status_code=429, detail="Too many requests, try again later.")

    table_status = describe_matches(find_matches(db, payload.first_name, payload.last_name, phone))
    create_invite_request(db, payload.first_name, payload.last_name, phone)
    background_tasks.add_task(notify_new_invite_request, payload.first_name, payload.last_name, phone, table_status)
    return InviteRequestAccepted()
