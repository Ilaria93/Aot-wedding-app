"""Introduces wedding_tables (admin-managed: label, capacity, note) and adds
rsvps.table_id (FK) — table assignment picks from a real catalog instead of
typing a name, so the dashboard can show real capacity/fill-rate.

Revision ID: 20260908_0008
Revises: 20260908_0006
Create Date: 2026-09-08 14:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260908_0008"
down_revision: Union[str, Sequence[str], None] = "20260908_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "wedding_tables",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("label", sa.String(length=80), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(length=120), nullable=True),
    )
    op.add_column("rsvps", sa.Column("table_id", sa.Integer(), sa.ForeignKey("wedding_tables.id"), nullable=True))


def downgrade() -> None:
    op.drop_column("rsvps", "table_id")
    op.drop_table("wedding_tables")
