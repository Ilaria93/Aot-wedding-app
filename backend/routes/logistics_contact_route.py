from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.base import get_db
from schemas.logistics_contact_schema import LogisticsContactResponse
from services.logistics_contact_service import list_public_logistics_contacts

router = APIRouter(prefix="/contacts")


# Returns the public travel and logistics directory for guests.
@router.get("", response_model=list[LogisticsContactResponse])
def list_public_contacts(db: Session = Depends(get_db)):
    return list_public_logistics_contacts(db)
