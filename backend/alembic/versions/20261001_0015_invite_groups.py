"""Invite groups: people linked to a head (spouse, partner, child, other),
gender for the greeting and an optional family name. Only heads carry a token.

Revision ID: 20261001_0015
Revises: 20261001_0014
Create Date: 2026-10-01 20:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261001_0015"
down_revision: Union[str, Sequence[str], None] = "20261001_0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("invite_links", sa.Column("gender", sa.String(length=1), nullable=True))
    op.add_column("invite_links", sa.Column("head_id", sa.Integer(), sa.ForeignKey("invite_links.id"), nullable=True))
    op.add_column("invite_links", sa.Column("relation", sa.String(length=10), nullable=True))
    op.add_column("invite_links", sa.Column("family_name", sa.String(length=80), nullable=True))
    op.create_index(op.f("ix_invite_links_head_id"), "invite_links", ["head_id"])
    op.alter_column("invite_links", "token", existing_type=sa.String(length=64), nullable=True)


def downgrade() -> None:
    # Members have no token; they cannot exist without the group columns.
    op.execute("DELETE FROM invite_requests WHERE invite_link_id IN (SELECT id FROM invite_links WHERE token IS NULL)")
    op.execute("DELETE FROM invite_links WHERE token IS NULL")
    op.alter_column("invite_links", "token", existing_type=sa.String(length=64), nullable=False)
    op.drop_index(op.f("ix_invite_links_head_id"), table_name="invite_links")
    op.drop_column("invite_links", "family_name")
    op.drop_column("invite_links", "relation")
    op.drop_column("invite_links", "head_id")
    op.drop_column("invite_links", "gender")
