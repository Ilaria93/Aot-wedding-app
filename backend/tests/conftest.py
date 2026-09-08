import os
from datetime import datetime
from pathlib import Path

TEST_DATABASE_URL = os.environ.setdefault(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/aot_wedding_app_test",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-for-local-tests"
os.environ["S3_BUCKET_NAME"] = "test-wedding-album"
os.environ["S3_REGION"] = "eu-central-1"
os.environ["S3_ACCESS_KEY_ID"] = "test-access-key"
os.environ["S3_SECRET_ACCESS_KEY"] = "test-secret-key"
os.environ["S3_PUBLIC_BASE_URL"] = "https://cdn.test-wedding.app"

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from database.postgres_admin import ensure_database_exists

ensure_database_exists(TEST_DATABASE_URL)

from database.base import engine, SessionLocal
from main import app
from models.user_model import User
from sqlalchemy import text

ALEMBIC_INI_PATH = Path(__file__).resolve().parents[1] / "alembic.ini"


def rebuild_test_database():
    """Creates a fresh test schema from Alembic migrations."""
    with engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
    alembic_config = Config(str(ALEMBIC_INI_PATH))
    alembic_config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(alembic_config, "head")


def truncate_test_tables():
    """Clears application data while keeping the migrated schema intact."""
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                TRUNCATE TABLE
                    invite_links,
                    refresh_token_sessions,
                    photo_album_items,
                    rsvp_guests,
                    rsvps,
                    logistics_contacts,
                    users
                RESTART IDENTITY CASCADE
                """
            )
        )


@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    rebuild_test_database()


@pytest.fixture(autouse=True)
def reset_database():
    truncate_test_tables()
    yield


@pytest.fixture
def api_client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def admin_headers(api_client, monkeypatch):
    # The single admin account is unlocked by a shared passcode
    # (WEDDING_ADMIN_SECRET) and provisioned on first login — nothing to
    # insert into the DB beforehand.
    monkeypatch.setattr("services.auth_service.read_wedding_admin_secret", lambda: "test-wedding-secret")

    # Logging in via the shared api_client stores the session in its cookie
    # jar — every later request made with that same client is authenticated
    # automatically, no header needed. Callers still pass `headers=admin_headers`
    # for symmetry with the old Bearer-header days; it's just empty now.
    response = api_client.post(
        "/auth/login",
        json={"secret": "test-wedding-secret", "remember_me": True},
    )
    assert response.status_code == 200, response.text
    return {}


@pytest.fixture
def user_headers(api_client):
    # A plain (non-admin) authenticated user for tests that don't care how
    # the session was created — guest accounts normally come from an invite
    # link, not from a direct DB insert, but tests only need a valid session.
    db = SessionLocal()
    user = User(
        first_name="Guest",
        last_name="Tester",
        email=None,
        password_hash=None,
        role="user",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    from services.auth_token_service import issue_auth_session

    db = SessionLocal()
    db_user = db.query(User).filter(User.id == user.id).first()
    session = issue_auth_session(db, db_user, remember_me=False)
    db.close()

    # No login endpoint for guests to call — set the cookie directly on the
    # shared client's cookie jar instead of going through a request.
    api_client.cookies.set("access_token", session.access_token)
    api_client.cookies.set("refresh_token", session.refresh_token)
    return {}
