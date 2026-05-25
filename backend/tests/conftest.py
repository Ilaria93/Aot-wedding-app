import os

os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key-for-local-tests")
os.environ.setdefault("ADMIN_ALLOWED_EMAILS", "admin@test.app,dawcorp@test.app,example@test.app")
os.environ.setdefault("S3_BUCKET_NAME", "test-wedding-album")
os.environ.setdefault("S3_REGION", "eu-central-1")
os.environ.setdefault("S3_ACCESS_KEY_ID", "test-access-key")
os.environ.setdefault("S3_SECRET_ACCESS_KEY", "test-secret-key")
os.environ.setdefault("S3_PUBLIC_BASE_URL", "https://cdn.test-wedding.app")

import pytest
from fastapi.testclient import TestClient

from database.base import Base, engine
from main import app


# Recreates tables before each test to keep tests isolated.
@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


# Shared API client for integration-style endpoint tests.
@pytest.fixture
def api_client():
    with TestClient(app) as client:
        yield client


# Creates a reusable admin bearer token for secured routes during tests.
@pytest.fixture
def admin_headers(api_client):
    response = api_client.post(
        "/auth/register",
        json={
            "first_name": "Admin",
            "last_name": "Tester",
            "email": "admin@test.app",
            "password": "super-secure-password",
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
            "remember_me": False,
        },
    )
    access_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}
