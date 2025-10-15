import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import date, datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import UUID
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
async def test_create_user_success(test_client: AsyncClient, valid_user_data: UserCreate):
    """Test successful user creation."""
    response = await test_client.post("/users", json=valid_user_data.model_dump(mode="json"))
    assert response.status_code == 201

    data = response.json()
    assert data["first_name"] == valid_user_data.first_name
    assert data["last_name"] == valid_user_data.last_name
    assert data["email"] == valid_user_data.email
    assert UUID(data["user_id"])
    assert datetime.fromisoformat(data["created_at"])


@pytest.mark.asyncio
async def test_create_user_success_empty_color(
    test_client: AsyncClient, valid_user_data: UserCreate
):
    """Test successful user creation."""
    user_data = valid_user_data.model_copy()
    user_data.color = "    "
    response = await test_client.post("/users", json=user_data.model_dump(mode="json"))
    assert response.status_code == 201

    data = response.json()
    assert data["first_name"] == valid_user_data.first_name
    assert data["last_name"] == valid_user_data.last_name
    assert data["email"] == valid_user_data.email
    assert UUID(data["user_id"])
    assert datetime.fromisoformat(data["created_at"])


@pytest.mark.asyncio
async def test_get_users_empty(test_client: AsyncClient):
    """Test getting users when database is empty."""
    response = await test_client.get("/users")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_users_with_filters(test_client: AsyncClient, valid_user_data: UserCreate):
    """Test getting users with filters."""
    await test_client.post("/users", json=valid_user_data.model_dump(mode="json"))

    response = await test_client.get(
        "/users", params={"filter_expression": f"email:eq:{valid_user_data.email}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["email"] == valid_user_data.email

    response = await test_client.get(
        "/users", params={"filter_expression": "email:eq:nonexistent@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 0


@pytest.mark.asyncio
async def test_get_users_pagination(test_client: AsyncClient, valid_user_data: UserCreate):
    """Test user listing pagination."""
    for i in range(5):
        user_data = valid_user_data.model_copy()
        user_data.email = f"user{i}@example.com"
        await test_client.post("/users", json=user_data.model_dump(mode="json"))

    response = await test_client.get("/users", params={"limit": 2, "offset": 1})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["offset"] == 1
    assert data["limit"] == 2


@pytest.mark.asyncio
async def test_delete_user(test_client: AsyncClient, valid_user_data: UserCreate):
    """Test user deletion."""
    response = await test_client.post("/users", json=valid_user_data.model_dump(mode="json"))
    user_id = response.json()["user_id"]

    response = await test_client.delete(f"/users/{user_id}")
    assert response.status_code == 200
    deleted_user = response.json()
    assert deleted_user["user_id"] == user_id

    response = await test_client.get("/users")
    assert response.status_code == 200
    assert len(response.json()["items"]) == 0
