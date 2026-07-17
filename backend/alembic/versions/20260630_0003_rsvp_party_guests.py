"""RSVP party guests and drop legacy dietary_notes on rsvps.

Revision ID: 20260630_0003
Revises: 20260616_0002
Create Date: 2026-06-30 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260630_0003"
down_revision: Union[str, Sequence[str], None] = "20260616_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rsvp_guests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rsvp_id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("meal_choice", sa.String(length=30), nullable=False),
        sa.Column("intolerance", sa.String(length=30), nullable=False),
        sa.Column("dietary_notes", sa.String(length=250), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["rsvp_id"], ["rsvps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rsvp_guests_rsvp_id", "rsvp_guests", ["rsvp_id"], unique=False)

    op.drop_column("rsvps", "dietary_notes")
    op.alter_column("rsvps", "faction", existing_type=sa.String(length=50), nullable=True)


def downgrade() -> None:
    op.alter_column("rsvps", "faction", existing_type=sa.String(length=50), nullable=False)
    op.add_column("rsvps", sa.Column("dietary_notes", sa.String(length=250), nullable=True))
    op.drop_index("ix_rsvp_guests_rsvp_id", table_name="rsvp_guests")
    op.drop_table("rsvp_guests")
