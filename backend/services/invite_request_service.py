from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models.invite_link_model import InviteLink
from models.invite_request_model import InviteRequest
from schemas.invite_request_schema import (
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
    request = db.query(InviteRequest).filter(InviteRequest.id == request_id).first()
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
    request.status = "rejected"
    request.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return _to_response(db, request)
