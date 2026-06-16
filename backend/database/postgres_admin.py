from typing import Optional

from psycopg import connect, sql
from sqlalchemy.engine import make_url

from settings import read_database_url, read_test_database_url


def _psycopg_connection_url(database_url: str, database: Optional[str] = None) -> str:
    """Normalize a SQLAlchemy PostgreSQL URL for psycopg.connect()."""
    url = make_url(database_url)
    base_driver = url.drivername.split("+", 1)[0]
    if database is not None:
        url = url.set(database=database)
    return url.set(drivername=base_driver).render_as_string(hide_password=False)


def ensure_database_exists(database_url: str):
    """Creates the target PostgreSQL database when it is missing."""
    url = make_url(database_url)
    if not url.drivername.startswith("postgresql"):
        return

    database_name = url.database
    if not database_name:
        return

    maintenance_database = "postgres" if database_name != "postgres" else "template1"
    admin_url = _psycopg_connection_url(database_url, database=maintenance_database)

    with connect(admin_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (database_name,),
            )
            if cursor.fetchone() is None:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(sql.Identifier(database_name))
                )


def ensure_default_databases_exist():
    """Creates both the application and test PostgreSQL databases when needed."""
    ensure_database_exists(read_database_url())
    ensure_database_exists(read_test_database_url())
