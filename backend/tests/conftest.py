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
