from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from models.rsvp_model import RSVP
from models.wedding_table_model import WeddingTable

router = APIRouter(prefix="/admin/rsvp")


class SetRsvpTableRequest(BaseModel):
    table_id: Optional[int] = None


class SetRsvpTableResponse(BaseModel):
    rsvp_id: int
    table_id: Optional[int] = None


# Manually assigns (or clears, with a null table_id) the table for one
# confirmed RSVP party, picked from the admin-managed table catalog
# (see admin_tables_route.py). There is no auto-assignment.
@router.patch("/{rsvp_id}/table", response_model=SetRsvpTableResponse)
def set_rsvp_table(
    rsvp_id: int,
    payload: SetRsvpTableRequest,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    rsvp = db.query(RSVP).filter(RSVP.id == rsvp_id).first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")

    if payload.table_id is not None and not db.query(WeddingTable).filter(WeddingTable.id == payload.table_id).first():
        raise HTTPException(status_code=422, detail="Table not found")

    rsvp.table_id = payload.table_id
    db.commit()
    db.refresh(rsvp)
    return SetRsvpTableResponse(rsvp_id=rsvp.id, table_id=rsvp.table_id)
