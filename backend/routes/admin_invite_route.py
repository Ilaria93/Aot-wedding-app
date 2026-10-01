from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.admin_invite_schema import (
    AdminInviteCreate,
    AdminInviteResponse,
    AdminInviteUpdate,
    ImportReport,
    InviteMatch,
)
from services.admin_invite_service import (
    DuplicateInviteError,
    InvalidInviteError,
    InviteLockedError,
    InviteNotFoundError,
    create_person,
    find_matches,
    get_admin_invite,
    list_admin_invites,
    mark_invite_sent,
    to_admin_invite,
    update_person,
    whatsapp_url_for_person,
)
from services.invite_import_service import ImportFileError, import_invites, parse_csv

router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin_user)])


# One entry per head (the person who receives the invite), with the people
# linked to them under `members`.
@router.get("/invites", response_model=list[AdminInviteResponse])
def list_invites(
    filter: Optional[Literal["to_send", "sent", "answered"]] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return list_admin_invites(db, filter, search)


# Who is already in the table with this name or phone (members included), so
# the admin can resend instead of adding the same person twice.
@router.get("/invites/lookup", response_model=list[InviteMatch])
def lookup_invites(first_name: str = "", last_name: str = "", phone: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        return find_matches(db, first_name, last_name, phone)
    except InvalidInviteError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


# Adds a head (no head_id) or a person linked to a head. There is no delete:
# an invite the guest may already have received must never disappear.
@router.post("/invites", response_model=AdminInviteResponse, status_code=201)
def create_invite(
    payload: AdminInviteCreate,
    confirm_duplicate: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    try:
        person = create_person(db, payload, confirm_duplicate)
    except DuplicateInviteError as error:
        raise HTTPException(
            status_code=409,
            detail={"code": "duplicate", "matches": [match.model_dump(mode="json") for match in error.matches]},
        ) from error
    except InviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InviteLockedError as error:
        raise HTTPException(status_code=409, detail={"code": "locked", "message": str(error)}) from error
    except InvalidInviteError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return to_admin_invite(db, person.head or person)


MAX_IMPORT_BYTES = 1_000_000


# Guest-list CSV (first_name,last_name,gender,relation,head,family_name,phone,party_size).
# People already in the table are skipped, so the same file can be loaded twice.
@router.post("/invites/import", response_model=ImportReport)
def import_invites_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    raw = file.file.read(MAX_IMPORT_BYTES + 1)
    if len(raw) > MAX_IMPORT_BYTES:
        raise HTTPException(status_code=413, detail="File too large.")
    try:
        report, _ = import_invites(db, parse_csv(raw))
    except ImportFileError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return report


# Editable only until the head's invite is sent; after that, just resend.
@router.patch("/invites/{invite_id}", response_model=AdminInviteResponse)
def update_invite(invite_id: int, payload: AdminInviteUpdate, db: Session = Depends(get_db)):
    try:
        person = update_person(db, invite_id, payload.model_dump(exclude_unset=True))
    except InviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InviteLockedError as error:
        raise HTTPException(status_code=409, detail={"code": "locked", "message": str(error)}) from error
    except InvalidInviteError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return to_admin_invite(db, person.head or person)


# The head's invite addressed to one person of the group.
@router.get("/invites/{head_id}/whatsapp/{person_id}")
def person_whatsapp(head_id: int, person_id: int, db: Session = Depends(get_db)):
    try:
        return {"whatsapp_url": whatsapp_url_for_person(db, head_id, person_id)}
    except InviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except InvalidInviteError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


# Called by the admin page right after it opens the wa.me link.
@router.post("/invites/{invite_id}/mark-sent", response_model=AdminInviteResponse)
def mark_sent(invite_id: int, db: Session = Depends(get_db)):
    try:
        return mark_invite_sent(db, invite_id)
    except InviteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
