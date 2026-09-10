"""Adds photo_album_items.tag (wedding-moment label picked at upload) and
is_favorite (admin-only "keep this one" flag) — see admin_photo_album_route.py.

Revision ID: 20260910_0013
Revises: 20260909_0012
Create Date: 2026-09-10 09:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260910_0013"
down_revision: Union[str, Sequence[str], None] = "20260909_0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("photo_album_items", sa.Column("tag", sa.String(length=30), nullable=True))
    op.create_index(op.f("ix_photo_album_items_tag"), "photo_album_items", ["tag"])
    op.add_column(
        "photo_album_items",
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("photo_album_items", "is_favorite", server_default=None)


def downgrade() -> None:
    op.drop_column("photo_album_items", "is_favorite")
    op.drop_index(op.f("ix_photo_album_items_tag"), table_name="photo_album_items")
    op.drop_column("photo_album_items", "tag")
