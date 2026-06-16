from pathlib import Path
from typing import Optional

from alembic.config import Config
from alembic.script import ScriptDirectory
from psycopg import connect

from database.postgres_admin import _psycopg_connection_url
from settings import read_database_url


def _read_alembic_version(database_url: str) -> Optional[str]:
    with connect(_psycopg_connection_url(database_url)) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT to_regclass('alembic_version')")
            if cursor.fetchone()[0] is None:
                return None
            cursor.execute("SELECT version_num FROM alembic_version")
            row = cursor.fetchone()
            return row[0] if row else None


def reconcile_stale_alembic_version() -> None:
    """Align alembic_version when the DB references a removed migration."""
    backend_dir = Path(__file__).resolve().parents[1]
    script = ScriptDirectory.from_config(Config(str(backend_dir / "alembic.ini")))
    database_url = read_database_url()
    current_version = _read_alembic_version(database_url)
    if not current_version:
        return

    try:
        script.get_revision(current_version)
        return
    except Exception:
        pass

    target_version = script.get_current_head()
    with connect(_psycopg_connection_url(database_url), autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE alembic_version SET version_num = %s",
                (target_version,),
            )

    print(
        "alembic_version era "
        f"'{current_version}' (migrazione non piu presente nel codice). "
        f"Allineato a '{target_version}'."
    )
