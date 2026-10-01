from datetime import datetime

from sqlalchemy.orm import Session

from models.invite_request_model import InviteRequest


# The couple handles requests from the Telegram message and the admin Inviti
# page (add the person or resend their invite); the row is only a record.
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
