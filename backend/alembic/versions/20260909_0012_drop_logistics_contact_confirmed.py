"""Drops logistics_contacts.confirmed — the only supplier states are
active/inactive (is_active), no separate confirmation status.

Revision ID: 20260909_0012
Revises: 20260909_0011
Create Date: 2026-09-09 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260909_0012"
down_revision: Union[str, Sequence[str], None] = "20260909_0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("logistics_contacts", "confirmed")


def downgrade() -> None:
    op.add_column(
        "logistics_contacts",
        sa.Column("confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("logistics_contacts", "confirmed", server_default=None)
