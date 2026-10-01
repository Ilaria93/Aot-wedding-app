"""Adds invite_requests (guests asking for their invite from the site) and
invite_links.sent_at (when the admin sent the invite on WhatsApp).

Revision ID: 20261001_0014
Revises: 20260910_0013
Create Date: 2026-10-01 12:00:00
"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261001_0014"
down_revision: Union[str, Sequence[str], None] = "20260910_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _normalize_phone(raw):
    """Frozen copy of services/phone_service.normalize_phone at this revision
    (E.164, +39 default, 8-15 digits). Returns None when invalid."""
    value = (raw or "").strip()
    if not value or not re.match(r"^\+?[0-9\s().-]+$", value):
        return None
    digits = re.sub(r"\D", "", value)
    if value.startswith("+"):
        pass
    elif digits.startswith("00"):
        digits = digits[2:]
    else:
        digits = "39" + digits
    if not 8 <= len(digits) <= 15:
        return None
    return f"+{digits}"


def upgrade() -> None:
    op.create_table(
        "invite_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("first_name", sa.String(length=80), nullable=False),
        sa.Column("last_name", sa.String(length=80), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("invite_link_id", sa.Integer(), sa.ForeignKey("invite_links.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("decided_at", sa.DateTime(), nullable=True),
    )
    op.create_index(op.f("ix_invite_requests_id"), "invite_requests", ["id"])
    op.create_index(op.f("ix_invite_requests_phone"), "invite_requests", ["phone"])
    op.create_index(op.f("ix_invite_requests_status"), "invite_requests", ["status"])
    op.add_column("invite_links", sa.Column("sent_at", sa.DateTime(), nullable=True))

    # Backfill: phones imported by the CLI script were stored raw; approval
    # matches on E.164. Keep the original value when it cannot be normalised.
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, phone FROM invite_links WHERE phone IS NOT NULL")).fetchall()
    for row_id, phone in rows:
        normalized = _normalize_phone(phone)
        if normalized and normalized != phone:
            bind.execute(
                sa.text("UPDATE invite_links SET phone = :phone WHERE id = :id"),
                {"phone": normalized, "id": row_id},
            )


def downgrade() -> None:
    # The phone backfill is not undone: the original raw values are not kept.
    op.drop_column("invite_links", "sent_at")
    op.drop_index(op.f("ix_invite_requests_status"), table_name="invite_requests")
    op.drop_index(op.f("ix_invite_requests_phone"), table_name="invite_requests")
    op.drop_index(op.f("ix_invite_requests_id"), table_name="invite_requests")
    op.drop_table("invite_requests")
