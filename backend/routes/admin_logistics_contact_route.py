from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.logistics_contact_schema import (
    LogisticsContactCreateRequest,
    LogisticsContactResponse,
    LogisticsContactUpdateRequest,
)
from services.logistics_contact_service import (
    create_logistics_contact,
    delete_logistics_contact,
    list_admin_logistics_contacts,
    update_logistics_contact,
)

router = APIRouter(prefix="/admin/contacts")


# Returns the full contacts directory to the admin dashboard.
@router.get("", response_model=list[LogisticsContactResponse])
def list_admin_contacts(
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return list_admin_logistics_contacts(db)


# Creates one logistics contact entry from the admin dashboard.
@router.post("", response_model=LogisticsContactResponse)
def create_admin_contact(
    payload: LogisticsContactCreateRequest,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return create_logistics_contact(db, payload)


# Updates one admin-managed contact entry.
@router.patch("/{contact_id}", response_model=LogisticsContactResponse)
def update_admin_contact(
    contact_id: int,
    payload: LogisticsContactUpdateRequest,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    updated_contact = update_logistics_contact(db, contact_id, payload)
    if not updated_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return updated_contact


# Deletes one contact entry when it is no longer needed.
@router.delete("/{contact_id}", status_code=204)
def delete_admin_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    if not delete_logistics_contact(db, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    return Response(status_code=204)
