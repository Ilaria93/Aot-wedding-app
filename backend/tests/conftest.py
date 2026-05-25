import os

os.environ.setdefault("ADMIN_API_KEY", "test-admin-api-key-value")
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


# Sends the configured admin secret for secured routes during tests.
@pytest.fixture
def admin_headers():
    return {"X-Admin-Api-Key": os.environ["ADMIN_API_KEY"]}
