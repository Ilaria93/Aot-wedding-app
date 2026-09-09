from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database.base import get_db
from dependencies.auth_user_dependency import require_admin_user
from schemas.admin_tables_schema import AdminTable, CreateTableRequest, UpdateTableRequest
from services.admin_tables_service import create_table, delete_table, list_tables, update_table

router = APIRouter(prefix="/admin/tables")


# Returns the full table catalog — the "Aggiungi al tavolo" dropdown and the
# Ripartizione Tavoli sidebar both read from this.
@router.get("", response_model=list[AdminTable])
def list_admin_tables(
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return list_tables(db)


@router.post("", response_model=AdminTable)
def create_admin_table(
    payload: CreateTableRequest,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    return create_table(db, payload)


@router.patch("/{table_id}", response_model=AdminTable)
def update_admin_table(
    table_id: int,
    payload: UpdateTableRequest,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    updated_table = update_table(db, table_id, payload)
    if not updated_table:
        raise HTTPException(status_code=404, detail="Table not found")
    return updated_table


@router.delete("/{table_id}", status_code=204)
def delete_admin_table(
    table_id: int,
    db: Session = Depends(get_db),
    _admin_ok=Depends(require_admin_user),
):
    delete_table(db, table_id)
    return Response(status_code=204)
