"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import date

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import db
from app.db import users as users_db
from app.db.users import metadata
from app.main import event_manager_app
from app.models.users import UserCreate


@pytest.fixture(scope="session")
def test_db_file() -> Generator[str, None, None]:
    """Create a temporary database file."""
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    yield f"sqlite+aiosqlite:///{db_path}"
    os.close(db_fd)
    os.remove(db_path)


@pytest_asyncio.fixture(scope="session")
async def test_engine(test_db_file: str) -> AsyncGenerator[AsyncEngine, None]:
    """Create a test engine and setup/teardown the database."""
    engine = create_async_engine(
        test_db_file,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Store original engine and metadata
    original_engine = db.engine
    original_metadata = db.metadata

    # Set test database config
    db.engine = engine
    db.metadata = metadata
    users_db.engine = engine

    yield engine

    # Restore original engine and metadata
    db.engine = original_engine
    db.metadata = original_metadata
    users_db.engine = original_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Reset the database before each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(metadata.drop_all)
        await conn.run_sync(metadata.create_all)
    yield


@pytest_asyncio.fixture
async def test_client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with an SQLite database."""
    transport = ASGITransport(app=event_manager_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def valid_user_data() -> UserCreate:
    """Return valid user data for testing."""
    return UserCreate(
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        date_of_birth=date(1990, 1, 1),
        color=None,
    )


@pytest.mark.asyncio
async def test_create_user_duplicate_email(
    test_client: AsyncClient, valid_user_data: UserCreate
):
    """Test that creating a user with a duplicate email fails."""
    response = await test_client.post("/users", json=valid_user_data.model_dump(mode="json"))
    assert response.status_code == 201

    response = await test_client.post("/users", json=valid_user_data.model_dump(mode="json"))
    assert response.status_code == 400
    assert "email already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_user_future_dob(test_client: AsyncClient):
    """Test user creation with invalid birth date."""
    invalid_data = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "date_of_birth": "2100-01-01",
        "color": "blue",
    }
    response = await test_client.post("/users", json=invalid_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_invalid_data(test_client: AsyncClient):
    """Test user creation with invalid data."""
    invalid_data = {
        "first_name": "",
        "last_name": "Doe",
        "email": "not-an-email",
        "date_of_birth": "2025-01-01",
        "color": "x" * 101,
    }
    response = await test_client.post("/users", json=invalid_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_users_invalid_filter_format(test_client: AsyncClient):
    """Test getting users with invalid filter_expression format."""
    response = await test_client.get("/users", params={"filter_expression": "email"})
    assert response.status_code == 400
    assert "invalid filter_expression format" in response.json()["detail"].lower()

    response = await test_client.get("/users", params={"filter_expression": "email:eq"})
    assert response.status_code == 400
    assert "invalid filter_expression format" in response.json()["detail"].lower()

    response = await test_client.get("/users", params={"filter_expression": ""})
    assert response.status_code == 400
    assert "invalid filter_expression format" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_users_invalid_filter_operator(test_client: AsyncClient):
    """Test getting users with invalid filter_expression operator."""
    response = await test_client.get(
        "/users", params={"filter_expression": "email:invalid:test@example.com"}
    )
    assert response.status_code == 400
    assert "invalid filter_expression format" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_users_invalid_filter_field(test_client: AsyncClient):
    """Test getting users with invalid filter_expression field."""
    response = await test_client.get(
        "/users", params={"filter_expression": "nonexistent:eq:value"}
    )
    assert response.status_code == 400
    assert "invalid column name" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_users_invalid_pagination(test_client: AsyncClient):
    """Test getting users with invalid pagination parameters."""
    response = await test_client.get("/users", params={"limit": -1})
    assert response.status_code == 422

    response = await test_client.get("/users", params={"offset": -1})
    assert response.status_code == 422

    response = await test_client.get("/users", params={"limit": "invalid"})
    assert response.status_code == 422

    response = await test_client.get("/users", params={"offset": "invalid"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_nonexistent_user(test_client: AsyncClient):
    """Test deleting a non-existent user."""
    fake_uuid = "12345678-1234-4321-1234-123456789012"
    response = await test_client.delete(f"/users/{fake_uuid}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
