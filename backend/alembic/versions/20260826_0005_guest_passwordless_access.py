"""Passwordless guest access via invite link: nullable email/password/phone
on users, invite-to-user binding, and invite phone/party_size.

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
    op.alter_column("users", "email", existing_type=sa.String(length=160), nullable=True)
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("phone", sa.String(length=30), nullable=True))

    op.add_column("invite_links", sa.Column("phone", sa.String(length=30), nullable=True))
    op.add_column("invite_links", sa.Column("party_size", sa.Integer(), nullable=True))
    op.add_column("invite_links", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_unique_constraint("uq_invite_links_user_id", "invite_links", ["user_id"])
    op.create_foreign_key(
        "fk_invite_links_user_id",
        "invite_links",
        "users",
        ["user_id"],
        ["id"],
    )


def downgrade() -> None:
    # Caveat: the final alter_columns below fail once any passwordless guest
    # exists (email/password_hash IS NULL). Backfill or delete those rows
    # first — deliberately not automated here, since either choice destroys
    # data.
    op.drop_constraint("fk_invite_links_user_id", "invite_links", type_="foreignkey")
    op.drop_constraint("uq_invite_links_user_id", "invite_links", type_="unique")
    op.drop_column("invite_links", "user_id")
    op.drop_column("invite_links", "party_size")
    op.drop_column("invite_links", "phone")

    op.drop_column("users", "phone")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("users", "email", existing_type=sa.String(length=160), nullable=False)
