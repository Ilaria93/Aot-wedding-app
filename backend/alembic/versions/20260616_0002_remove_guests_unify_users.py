"""remove guests and link rsvp/photos to users

Revision ID: 20260616_0002
Revises: 20260526_0001
Create Date: 2026-06-16 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260616_0002"
down_revision: Union[str, Sequence[str], None] = "20260526_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop guest invites and bind RSVP/photos to authenticated users."""
    op.execute(
        "TRUNCATE TABLE photo_album_items, rsvps, refresh_token_sessions, users RESTART IDENTITY CASCADE"
    )

    op.drop_constraint("photo_album_items_guest_id_fkey", "photo_album_items", type_="foreignkey")
    op.drop_index("ix_photo_album_items_guest_id", table_name="photo_album_items")
    op.drop_column("photo_album_items", "guest_id")
    op.add_column("photo_album_items", sa.Column("user_id", sa.Integer(), nullable=False))
    op.create_foreign_key(
        "photo_album_items_user_id_fkey",
        "photo_album_items",
        "users",
        ["user_id"],
        ["id"],
    )
    op.create_index("ix_photo_album_items_user_id", "photo_album_items", ["user_id"], unique=False)

    op.drop_constraint("rsvps_guest_id_fkey", "rsvps", type_="foreignkey")
    op.drop_constraint("rsvps_guest_id_key", "rsvps", type_="unique")
    op.drop_column("rsvps", "guest_id")
    op.add_column("rsvps", sa.Column("user_id", sa.Integer(), nullable=False))
    op.create_foreign_key("rsvps_user_id_fkey", "rsvps", "users", ["user_id"], ["id"])
    op.create_index("ix_rsvps_user_id", "rsvps", ["user_id"], unique=True)

    op.drop_index("ix_guests_invitation_token", table_name="guests")
    op.drop_index("ix_guests_id", table_name="guests")
    op.drop_table("guests")

    op.alter_column("users", "role", server_default="user")


def downgrade() -> None:
    """Restore guest-based schema (data is not restored)."""
    op.alter_column("users", "role", server_default="invited")

    op.create_table(
        "guests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("invitation_token", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_guests_id", "guests", ["id"], unique=False)
    op.create_index("ix_guests_invitation_token", "guests", ["invitation_token"], unique=True)

    op.drop_index("ix_rsvps_user_id", table_name="rsvps")
    op.drop_constraint("rsvps_user_id_fkey", "rsvps", type_="foreignkey")
    op.drop_column("rsvps", "user_id")
    op.add_column("rsvps", sa.Column("guest_id", sa.Integer(), nullable=False))
    op.create_foreign_key("rsvps_guest_id_fkey", "rsvps", "guests", ["guest_id"], ["id"])
    op.create_unique_constraint("rsvps_guest_id_key", "rsvps", ["guest_id"])

    op.drop_index("ix_photo_album_items_user_id", table_name="photo_album_items")
    op.drop_constraint("photo_album_items_user_id_fkey", "photo_album_items", type_="foreignkey")
    op.drop_column("photo_album_items", "user_id")
    op.add_column("photo_album_items", sa.Column("guest_id", sa.Integer(), nullable=False))
    op.create_foreign_key(
        "photo_album_items_guest_id_fkey",
        "photo_album_items",
        "guests",
        ["guest_id"],
        ["id"],
    )
    op.create_index("ix_photo_album_items_guest_id", "photo_album_items", ["guest_id"], unique=False)
