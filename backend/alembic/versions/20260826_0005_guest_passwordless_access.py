"""Passwordless guest RSVP access: nullable password, invite-to-user link, magic links.

Revision ID: 20260826_0005
Revises: 20260818_0004
Create Date: 2026-08-26 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260826_0005"
down_revision: Union[str, Sequence[str], None] = "20260818_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)

    op.add_column("invite_links", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_unique_constraint("uq_invite_links_user_id", "invite_links", ["user_id"])
    op.create_foreign_key(
        "fk_invite_links_user_id",
        "invite_links",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_table(
        "guest_magic_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_guest_magic_links_user_id", "guest_magic_links", ["user_id"], unique=False)
    op.create_index(
        "ix_guest_magic_links_token_hash", "guest_magic_links", ["token_hash"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_guest_magic_links_token_hash", table_name="guest_magic_links")
    op.drop_index("ix_guest_magic_links_user_id", table_name="guest_magic_links")
    op.drop_table("guest_magic_links")

    op.drop_constraint("fk_invite_links_user_id", "invite_links", type_="foreignkey")
    op.drop_constraint("uq_invite_links_user_id", "invite_links", type_="unique")
    op.drop_column("invite_links", "user_id")

    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
