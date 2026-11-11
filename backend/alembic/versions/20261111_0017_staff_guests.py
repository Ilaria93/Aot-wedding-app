"""Staff guests: suppliers' people who eat at the reception (menu filled in by the couple, seat at a table).

Revision ID: 20261111_0017
Revises: 20261108_0016
Create Date: 2026-11-11 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261111_0017"
down_revision: Union[str, Sequence[str], None] = "20261108_0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "staff_guests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("role", sa.String(length=80), nullable=True),
        sa.Column("meal_choice", sa.String(length=30), nullable=False, server_default="standard"),
        sa.Column("intolerance", sa.String(length=30), nullable=False, server_default="none"),
        sa.Column("dietary_notes", sa.String(length=250), nullable=True),
        sa.Column("table_id", sa.Integer(), sa.ForeignKey("wedding_tables.id"), nullable=True),
    )
    op.create_index(op.f("ix_staff_guests_id"), "staff_guests", ["id"])
    op.create_index(op.f("ix_staff_guests_table_id"), "staff_guests", ["table_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_staff_guests_table_id"), table_name="staff_guests")
    op.drop_index(op.f("ix_staff_guests_id"), table_name="staff_guests")
    op.drop_table("staff_guests")
