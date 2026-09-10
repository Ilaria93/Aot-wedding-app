"""Adds logistics_contacts.confirmed — whether a supplier confirmed back,
tracked separately from is_active so the admin dashboard can show
Attivi/Confermati/In attesa as distinct counts.

Revision ID: 20260909_0010
Revises: 20260908_0009
Create Date: 2026-09-09 10:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260909_0010"
down_revision: Union[str, Sequence[str], None] = "20260908_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "logistics_contacts",
        sa.Column("confirmed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("logistics_contacts", "confirmed", server_default=None)


def downgrade() -> None:
    op.drop_column("logistics_contacts", "confirmed")
