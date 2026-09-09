"""Seeds 8 default tables (label + capacity 10, no note) so the admin has a
starting catalog instead of an empty "Ripartizione Tavoli" — renamed/resized
freely afterward from the dashboard.

Revision ID: 20260908_0009
Revises: 20260908_0008
Create Date: 2026-09-08 15:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260908_0009"
down_revision: Union[str, Sequence[str], None] = "20260908_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_TABLE_COUNT = 8
DEFAULT_CAPACITY = 10

wedding_tables = sa.table(
    "wedding_tables",
    sa.column("label", sa.String),
    sa.column("capacity", sa.Integer),
    sa.column("note", sa.String),
)


def upgrade() -> None:
    connection = op.get_bind()
    existing_count = connection.execute(sa.text("SELECT COUNT(*) FROM wedding_tables")).scalar()
    if existing_count:
        return

    op.bulk_insert(
        wedding_tables,
        [
            {"label": f"Tavolo {index}", "capacity": DEFAULT_CAPACITY, "note": None}
            for index in range(1, DEFAULT_TABLE_COUNT + 1)
        ],
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM wedding_tables WHERE note IS NULL AND capacity = :capacity").bindparams(
        capacity=DEFAULT_CAPACITY
    ))
