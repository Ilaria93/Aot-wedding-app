from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.rsvp_model import RSVP
from models.wedding_table_model import WeddingTable
from schemas.admin_tables_schema import CreateTableRequest, UpdateTableRequest


def list_tables(db: Session) -> list[WeddingTable]:
    return db.query(WeddingTable).order_by(WeddingTable.label.asc()).all()


def create_table(db: Session, payload: CreateTableRequest) -> WeddingTable:
    table = WeddingTable(**payload.model_dump())
    db.add(table)
    db.commit()
    db.refresh(table)
    return table


def update_table(db: Session, table_id: int, payload: UpdateTableRequest) -> Optional[WeddingTable]:
    table = db.query(WeddingTable).filter(WeddingTable.id == table_id).first()
    if not table:
        return None

    for field_name, field_value in payload.model_dump(exclude_unset=True).items():
        setattr(table, field_name, field_value)

    db.commit()
    db.refresh(table)
    return table


def delete_table(db: Session, table_id: int) -> None:
    table = db.query(WeddingTable).filter(WeddingTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    if db.query(RSVP).filter(RSVP.table_id == table_id).first():
        raise HTTPException(status_code=409, detail="Table still has guests assigned")

    db.delete(table)
    db.commit()
