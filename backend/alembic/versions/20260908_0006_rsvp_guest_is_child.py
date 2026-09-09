"""Adds is_child to rsvp_guests, set by the guest during RSVP confirmation
and shown read-only in the admin confirmed-guests dashboard.

Revision ID: 20260908_0006
Revises: 20260826_0005
Create Date: 2026-09-08 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260908_0006"
down_revision: Union[str, Sequence[str], None] = "20260826_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rsvp_guests",
        sa.Column("is_child", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("rsvp_guests", "is_child", server_default=None)


def downgrade() -> None:
    op.drop_column("rsvp_guests", "is_child")
