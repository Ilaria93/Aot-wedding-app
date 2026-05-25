from typing import Optional

from sqlalchemy.orm import Session

from models.logistics_contact_model import LogisticsContact
from schemas.logistics_contact_schema import (
    LogisticsContactCreateRequest,
    LogisticsContactUpdateRequest,
)


# Returns only active contacts for guest-facing travel hub screens.
def list_public_logistics_contacts(db: Session) -> list[LogisticsContact]:
    return (
        db.query(LogisticsContact)
        .filter(LogisticsContact.is_active.is_(True))
        .order_by(LogisticsContact.sort_order.asc(), LogisticsContact.label.asc())
        .all()
    )


# Returns the full directory so admin can edit active and inactive entries.
def list_admin_logistics_contacts(db: Session) -> list[LogisticsContact]:
    return (
        db.query(LogisticsContact)
        .order_by(LogisticsContact.sort_order.asc(), LogisticsContact.label.asc())
        .all()
    )


def create_logistics_contact(
    db: Session, payload: LogisticsContactCreateRequest
) -> LogisticsContact:
    created_contact = LogisticsContact(**payload.model_dump())
    db.add(created_contact)
    db.commit()
    db.refresh(created_contact)
    return created_contact


def update_logistics_contact(
    db: Session, contact_id: int, payload: LogisticsContactUpdateRequest
) -> Optional[LogisticsContact]:
    contact = db.query(LogisticsContact).filter(LogisticsContact.id == contact_id).first()
    if not contact:
        return None

    for field_name, field_value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field_name, field_value)

    db.commit()
    db.refresh(contact)
    return contact


def delete_logistics_contact(db: Session, contact_id: int) -> bool:
    contact = db.query(LogisticsContact).filter(LogisticsContact.id == contact_id).first()
    if not contact:
        return False

    db.delete(contact)
    db.commit()
    return True
