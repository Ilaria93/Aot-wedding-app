from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.admin_staff_guest_schema import StaffGuestCreate, StaffGuestResponse, StaffGuestUpdate
from services.admin_staff_guest_service import (
    create_staff_guest,
    delete_staff_guest,
    list_staff_guests,
    update_staff_guest,
)

router = APIRouter(prefix="/admin/staff-guests", dependencies=[Depends(require_admin_user)])


# Suppliers' people (band, photographer, ...) who eat at the reception: the
# couple fills in their menu and seats them at a table, like any guest.
@router.get("", response_model=list[StaffGuestResponse])
def list_staff(db: Session = Depends(get_db)):
    return list_staff_guests(db)


@router.post("", response_model=StaffGuestResponse, status_code=201)
def create_staff(payload: StaffGuestCreate, db: Session = Depends(get_db)):
    return create_staff_guest(db, payload)


@router.patch("/{guest_id}", response_model=StaffGuestResponse)
def update_staff(guest_id: int, payload: StaffGuestUpdate, db: Session = Depends(get_db)):
    return update_staff_guest(db, guest_id, payload)


@router.delete("/{guest_id}", status_code=204)
def delete_staff(guest_id: int, db: Session = Depends(get_db)):
    delete_staff_guest(db, guest_id)
    return Response(status_code=204)
