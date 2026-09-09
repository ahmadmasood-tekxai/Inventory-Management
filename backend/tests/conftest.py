import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_qasim_inventory.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Fresh schema for every test function — full isolation, no test order coupling."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Registers a fresh admin user and returns ready-to-use Authorization headers."""
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "admin",
            "email": "admin@qasim.example.com",
            "password": "SuperSecret123",
            "full_name": "Admin User",
            "role": "ADMIN",
        },
    )
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "SuperSecret123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
