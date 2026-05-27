from psycopg import connect, sql
from sqlalchemy.engine import make_url

from settings import read_database_url, read_test_database_url


def ensure_database_exists(database_url: str):
    """Creates the target PostgreSQL database when it is missing."""
    url = make_url(database_url)
    if not url.drivername.startswith("postgresql"):
        return

    database_name = url.database
    if not database_name:
        return

    maintenance_database = "postgres" if database_name != "postgres" else "template1"
    admin_url = url.set(database=maintenance_database).render_as_string(hide_password=False)

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
