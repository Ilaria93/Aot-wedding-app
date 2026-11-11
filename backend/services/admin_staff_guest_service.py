from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.staff_guest_model import StaffGuest
from models.wedding_table_model import WeddingTable
from schemas.admin_staff_guest_schema import StaffGuestCreate, StaffGuestResponse, StaffGuestUpdate


def _to_response(db: Session, guest: StaffGuest) -> StaffGuestResponse:
    table = db.query(WeddingTable).filter(WeddingTable.id == guest.table_id).first() if guest.table_id else None
    response = StaffGuestResponse.model_validate(guest)
    response.table_label = table.label if table else None
    return response


def _require_table(db: Session, table_id: Optional[int]) -> None:
    if table_id is not None and not db.query(WeddingTable).filter(WeddingTable.id == table_id).first():
        raise HTTPException(status_code=404, detail="Table not found")


def list_staff_guests(db: Session) -> list[StaffGuestResponse]:
    return [_to_response(db, guest) for guest in db.query(StaffGuest).order_by(StaffGuest.id).all()]


def create_staff_guest(db: Session, payload: StaffGuestCreate) -> StaffGuestResponse:
    _require_table(db, payload.table_id)
    guest = StaffGuest(
        name=payload.name,
        role=payload.role,
        meal_choice=payload.meal_choice.value,
        intolerance=payload.intolerance.value,
        dietary_notes=payload.dietary_notes,
        table_id=payload.table_id,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return _to_response(db, guest)


def update_staff_guest(db: Session, guest_id: int, payload: StaffGuestUpdate) -> StaffGuestResponse:
    guest = db.query(StaffGuest).filter(StaffGuest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Staff guest not found")
    changes = payload.model_dump(exclude_unset=True)
    if "table_id" in changes:
        _require_table(db, changes["table_id"])
    for field_name in ("name", "meal_choice", "intolerance"):
        if field_name in changes and changes[field_name] is None:
            raise HTTPException(status_code=422, detail=f"{field_name} cannot be empty")
    for field_name, value in changes.items():
        setattr(guest, field_name, getattr(value, "value", value))
    db.commit()
    db.refresh(guest)
    return _to_response(db, guest)


def delete_staff_guest(db: Session, guest_id: int) -> None:
    guest = db.query(StaffGuest).filter(StaffGuest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Staff guest not found")
    db.delete(guest)
    db.commit()
