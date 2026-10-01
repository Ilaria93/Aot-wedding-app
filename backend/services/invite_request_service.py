from datetime import datetime
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink
from models.invite_request_model import InviteRequest
from models.rsvp_model import RSVP
from schemas.invite_request_schema import (
    AdminInviteResponse,
    ApproveInviteRequestResponse,
    ExistingInviteSummary,
    InviteRequestResponse,
)
from services.invite_link_service import build_invite_url, generate_unique_token
from services.invite_message_service import build_whatsapp_url


def create_invite_request(db: Session, first_name: str, last_name: str, phone_e164: str) -> InviteRequest:
    request = InviteRequest(
        first_name=first_name,
        last_name=last_name,
        phone=phone_e164,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


class InviteRequestNotFoundError(Exception):
    pass


class InviteRequestAlreadyDecidedError(Exception):
    pass


def _require_pending(request: InviteRequest) -> None:
    # A double tap or a stale admin tab must not re-decide a request.
    if request.status != "pending":
        raise InviteRequestAlreadyDecidedError("Invite request already decided")


def _invite_for_phone(db: Session, phone: str) -> Optional[InviteLink]:
    return db.query(InviteLink).filter(InviteLink.phone == phone).order_by(InviteLink.id).first()


def _to_response(db: Session, request: InviteRequest) -> InviteRequestResponse:
    response = InviteRequestResponse.model_validate(request)
    existing = _invite_for_phone(db, request.phone)
    if existing:
        response.existing_invite = ExistingInviteSummary(
            id=existing.id, first_name=existing.first_name, last_name=existing.last_name
        )
    return response


def _get_request(db: Session, request_id: int) -> InviteRequest:
    request = db.query(InviteRequest).filter(InviteRequest.id == request_id).with_for_update().first()
    if not request:
        raise InviteRequestNotFoundError("Invite request not found")
    return request


def list_invite_requests(db: Session, status: Optional[str]) -> list[InviteRequestResponse]:
    query = db.query(InviteRequest)
    if status:
        query = query.filter(InviteRequest.status == status)
    return [_to_response(db, row) for row in query.order_by(InviteRequest.created_at.desc()).all()]


def count_pending_requests(db: Session) -> int:
    return db.query(InviteRequest).filter(InviteRequest.status == "pending").count()


# Reuses the invite already tied to this phone (a guest who lost the link
# gets the same one back); otherwise creates a fresh invite for them.
def approve_invite_request(db: Session, request_id: int) -> ApproveInviteRequestResponse:
    request = _get_request(db, request_id)
    _require_pending(request)
    invite = _invite_for_phone(db, request.phone)
    if not invite:
        invite = InviteLink(
            token=generate_unique_token(db),
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            created_at=datetime.utcnow(),
        )
        db.add(invite)
        db.flush()

    request.status = "approved"
    request.invite_link_id = invite.id
    request.decided_at = datetime.utcnow()
    db.commit()

    invite_url = build_invite_url(invite.token)
    return ApproveInviteRequestResponse(
        invite_link_id=invite.id,
        invite_url=invite_url,
        whatsapp_url=build_whatsapp_url(invite.phone, invite.first_name, invite_url),
    )


def reject_invite_request(db: Session, request_id: int) -> InviteRequestResponse:
    request = _get_request(db, request_id)
    _require_pending(request)
    request.status = "rejected"
    request.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return _to_response(db, request)


class InviteNotFoundError(Exception):
    pass


# ponytail: N+1 per invite, join RSVP if the list ever grows large
def _answer_for(db: Session, invite: InviteLink) -> str:
    if not invite.user_id:
        return "none"
    rsvp = db.query(RSVP).filter(RSVP.user_id == invite.user_id).first()
    if not rsvp:
        return "none"
    return "attending" if rsvp.attending else "declined"


def _to_admin_invite(db: Session, invite: InviteLink) -> AdminInviteResponse:
    invite_url = build_invite_url(invite.token)
    return AdminInviteResponse(
        id=invite.id,
        first_name=invite.first_name,
        last_name=invite.last_name,
        phone=invite.phone,
        sent_at=invite.sent_at,
        answer=_answer_for(db, invite),
        invite_url=invite_url,
        whatsapp_url=build_whatsapp_url(invite.phone, invite.first_name, invite_url),
    )


def list_admin_invites(db: Session, filter: Optional[str], search: Optional[str]) -> list[AdminInviteResponse]:
    query = db.query(InviteLink)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(InviteLink.first_name.ilike(pattern), InviteLink.last_name.ilike(pattern), InviteLink.phone.ilike(pattern))
        )
    invites = [_to_admin_invite(db, invite) for invite in query.order_by(InviteLink.id).all()]
    if filter == "to_send":
        return [invite for invite in invites if invite.sent_at is None]
    if filter == "sent":
        return [invite for invite in invites if invite.sent_at is not None]
    if filter == "answered":
        return [invite for invite in invites if invite.answer != "none"]
    return invites


def mark_invite_sent(db: Session, invite_id: int) -> AdminInviteResponse:
    invite = db.query(InviteLink).filter(InviteLink.id == invite_id).first()
    if not invite:
        raise InviteNotFoundError("Invite not found")
    # Resending keeps the first-sent date: "Inviato il" means the first send.
    if invite.sent_at is None:
        invite.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(invite)
    return _to_admin_invite(db, invite)
