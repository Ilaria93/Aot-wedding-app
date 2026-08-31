"""Create invite_links table for the WhatsApp envelope invite.

Revision ID: 20260818_0004
Revises: 20260630_0003
Create Date: 2026-08-18 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260818_0004"
down_revision: Union[str, Sequence[str], None] = "20260630_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "invite_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("first_name", sa.String(length=80), nullable=False),
        sa.Column("last_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invite_links_token", "invite_links", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_invite_links_token", table_name="invite_links")
    op.drop_table("invite_links")
