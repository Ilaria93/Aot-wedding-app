"""create initial schema

Revision ID: 20260526_0001
Revises:
Create Date: 2026-05-26 15:20:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260526_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "guests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("invitation_token", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_guests_id", "guests", ["id"], unique=False)
    op.create_index(
        "ix_guests_invitation_token",
        "guests",
        ["invitation_token"],
        unique=True,
    )

    op.create_table(
        "logistics_contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("contact_person", sa.String(length=120), nullable=True),
        sa.Column("phone", sa.String(length=80), nullable=True),
        sa.Column("whatsapp_phone", sa.String(length=80), nullable=True),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("instagram_url", sa.String(length=255), nullable=True),
        sa.Column("facebook_url", sa.String(length=255), nullable=True),
        sa.Column("tiktok_url", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.String(length=300), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_logistics_contacts_category", "logistics_contacts", ["category"], unique=False)
    op.create_index("ix_logistics_contacts_id", "logistics_contacts", ["id"], unique=False)
    op.create_index("ix_logistics_contacts_is_active", "logistics_contacts", ["is_active"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=80), nullable=False),
        sa.Column("last_name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "photo_album_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("guest_id", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=80), nullable=False),
        sa.Column("caption", sa.String(length=250), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["guest_id"], ["guests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_photo_album_items_guest_id", "photo_album_items", ["guest_id"], unique=False)
    op.create_index("ix_photo_album_items_id", "photo_album_items", ["id"], unique=False)
    op.create_index("ix_photo_album_items_status", "photo_album_items", ["status"], unique=False)
    op.create_index("ix_photo_album_items_storage_key", "photo_album_items", ["storage_key"], unique=True)

    op.create_table(
        "refresh_token_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=128), nullable=False),
        sa.Column("remember_me", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_token_sessions_expires_at", "refresh_token_sessions", ["expires_at"], unique=False)
    op.create_index("ix_refresh_token_sessions_id", "refresh_token_sessions", ["id"], unique=False)
    op.create_index("ix_refresh_token_sessions_jti", "refresh_token_sessions", ["jti"], unique=True)
    op.create_index("ix_refresh_token_sessions_user_id", "refresh_token_sessions", ["user_id"], unique=False)

    op.create_table(
        "rsvps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("guest_id", sa.Integer(), nullable=False),
        sa.Column("attending", sa.Boolean(), nullable=False),
        sa.Column("faction", sa.String(length=50), nullable=False),
        sa.Column("dietary_notes", sa.String(length=250), nullable=True),
        sa.ForeignKeyConstraint(["guest_id"], ["guests.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("guest_id"),
    )
    op.create_index("ix_rsvps_id", "rsvps", ["id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_rsvps_id", table_name="rsvps")
    op.drop_table("rsvps")

    op.drop_index("ix_refresh_token_sessions_user_id", table_name="refresh_token_sessions")
    op.drop_index("ix_refresh_token_sessions_jti", table_name="refresh_token_sessions")
    op.drop_index("ix_refresh_token_sessions_id", table_name="refresh_token_sessions")
    op.drop_index("ix_refresh_token_sessions_expires_at", table_name="refresh_token_sessions")
    op.drop_table("refresh_token_sessions")

    op.drop_index("ix_photo_album_items_storage_key", table_name="photo_album_items")
    op.drop_index("ix_photo_album_items_status", table_name="photo_album_items")
    op.drop_index("ix_photo_album_items_id", table_name="photo_album_items")
    op.drop_index("ix_photo_album_items_guest_id", table_name="photo_album_items")
    op.drop_table("photo_album_items")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_logistics_contacts_is_active", table_name="logistics_contacts")
    op.drop_index("ix_logistics_contacts_id", table_name="logistics_contacts")
    op.drop_index("ix_logistics_contacts_category", table_name="logistics_contacts")
    op.drop_table("logistics_contacts")

    op.drop_index("ix_guests_invitation_token", table_name="guests")
    op.drop_index("ix_guests_id", table_name="guests")
    op.drop_table("guests")
