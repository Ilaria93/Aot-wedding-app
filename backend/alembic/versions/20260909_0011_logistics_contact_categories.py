"""Remaps logistics_contacts.category to the new taxonomy: hotel -> location,
hair/makeup -> beauty (unified), car_rental -> transfer (unified). transfer
and laundry keep their ids. catering is new, with no existing rows to remap.

Revision ID: 20260909_0011
Revises: 20260909_0010
Create Date: 2026-09-09 11:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260909_0011"
down_revision: Union[str, Sequence[str], None] = "20260909_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FORWARD_MAP = {
    "hotel": "location",
    "hair": "beauty",
    "makeup": "beauty",
    "car_rental": "transfer",
}
# Downgrade is lossy for hair/makeup (both mapped to beauty) — picks makeup
# arbitrarily since there's no way to recover which one a row originally was.
BACKWARD_MAP = {
    "location": "hotel",
    "beauty": "makeup",
    "catering": "hotel",
}

logistics_contacts = sa.table("logistics_contacts", sa.column("category", sa.String))


def upgrade() -> None:
    connection = op.get_bind()
    for old_value, new_value in FORWARD_MAP.items():
        connection.execute(
            logistics_contacts.update()
            .where(logistics_contacts.c.category == old_value)
            .values(category=new_value)
        )


def downgrade() -> None:
    connection = op.get_bind()
    for old_value, new_value in BACKWARD_MAP.items():
        connection.execute(
            logistics_contacts.update()
            .where(logistics_contacts.c.category == old_value)
            .values(category=new_value)
        )
