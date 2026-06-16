from database.postgres_admin import _psycopg_connection_url


def test_psycopg_connection_url_strips_sqlalchemy_driver_suffix():
    sqlalchemy_url = (
        "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/aot_wedding_app"
    )

    assert _psycopg_connection_url(sqlalchemy_url) == (
        "postgresql://postgres:postgres@127.0.0.1:5432/aot_wedding_app"
    )


def test_psycopg_connection_url_can_override_database():
    sqlalchemy_url = (
        "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/aot_wedding_app"
    )

    assert _psycopg_connection_url(sqlalchemy_url, database="postgres") == (
        "postgresql://postgres:postgres@127.0.0.1:5432/postgres"
    )
