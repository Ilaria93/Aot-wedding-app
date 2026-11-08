"""Seed the couple's residence as a 'lodging' supplier, so the home page's
lodging card (previously hard-coded) is now edited from the admin contacts.

Revision ID: 20261108_0016
Revises: 20261001_0015
Create Date: 2026-11-08 12:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261108_0016"
down_revision: Union[str, Sequence[str], None] = "20261001_0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Only if the couple have not added one themselves already.
    op.execute(
        sa.text(
            """
            INSERT INTO logistics_contacts (category, label, phone, whatsapp_phone, website, sort_order, is_active)
            SELECT 'lodging', 'Long Beach Village', '+390544494339', '+393279696145',
                   'https://www.lidoadriano.com/scheda-hotel_it.php?id=2', 0, TRUE
            WHERE NOT EXISTS (SELECT 1 FROM logistics_contacts WHERE category = 'lodging')
            """
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM logistics_contacts WHERE category = 'lodging'"))
