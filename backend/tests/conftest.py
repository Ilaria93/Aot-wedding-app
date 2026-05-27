import os
from pathlib import Path

from alembic import command
from alembic.config import Config

from settings import DEFAULT_TEST_DATABASE_URL

TEST_DATABASE_URL = os.environ.setdefault("TEST_DATABASE_URL", DEFAULT_TEST_DATABASE_URL)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-local-tests")
os.environ.setdefault("S3_BUCKET_NAME", "test-wedding-album")
os.environ.setdefault("S3_REGION", "eu-central-1")
os.environ.setdefault("S3_ACCESS_KEY_ID", "test-access-key")
os.environ.setdefault("S3_SECRET_ACCESS_KEY", "test-secret-key")
os.environ.setdefault("S3_PUBLIC_BASE_URL", "https://cdn.test-wedding.app")

import pytest
from fastapi.testclient import TestClient

from database.postgres_admin import ensure_database_exists

ensure_database_exists(TEST_DATABASE_URL)

from database.base import Base, engine
from main import app

ALEMBIC_INI_PATH = Path(__file__).resolve().parents[1] / "alembic.ini"


def upgrade_test_database():
    """Builds the test schema using the same Alembic migrations as the app."""
    alembic_config = Config(str(ALEMBIC_INI_PATH))
    alembic_config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(alembic_config, "head")


# Recreates the schema before each test to keep tests isolated.
@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    upgrade_test_database()
    yield


# Shared API client for integration-style endpoint tests.
@pytest.fixture
def api_client():
    with TestClient(app) as client:
        yield client


# Creates a reusable privileged bearer token for secured routes during tests.
@pytest.fixture
def admin_headers(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Ilaria",
            "last_name": "Bride",
            "email": "bride@test.app",
            "password": "super-secure-password",
            "role": "bride",
            "remember_me": True,
        },
    )
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


# Creates a groom bearer token to verify both spouse roles can manage the wedding area.
@pytest.fixture
def groom_headers(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Davide",
            "last_name": "Groom",
            "email": "groom@test.app",
            "password": "super-secure-password",
            "role": "groom",
            "remember_me": True,
        },
    )
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


# Creates a normal invited user token to verify admin protections.
@pytest.fixture
def invited_headers(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Guest",
            "last_name": "Tester",
            "email": "guest@test.app",
            "password": "super-secure-password",
            "role": "invited",
            "remember_me": False,
        },
    )
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}
