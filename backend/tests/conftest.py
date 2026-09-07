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
from services.auth_credentials_service import hash_password
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
def admin_headers(api_client):
    # Admin accounts are seeded directly (scripts/seed_admin_users.py in
    # production) — there is no registration endpoint to call here either.
    db = SessionLocal()
    db.add(
        User(
            first_name="Ilaria",
            last_name="Admin",
            email="admin@test.app",
            password_hash=hash_password("super-secure-password"),
            role="admin",
            created_at=datetime.utcnow(),
        )
    )
    db.commit()
    db.close()

    response = api_client.post(
        "/auth/login",
        json={"email": "admin@test.app", "password": "super-secure-password", "remember_me": True},
    )
    assert response.status_code == 200, response.text
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


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
    return {"Authorization": f"Bearer {session.access_token}"}
