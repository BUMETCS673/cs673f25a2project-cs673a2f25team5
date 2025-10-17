"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import categories as categories_db
from app.db import db
from app.db import events as events_db
from app.db import users as users_db
from app.db.categories import metadata as categories_metadata
from app.db.events import metadata as events_metadata
from app.db.users import metadata as users_metadata
from app.main import event_manager_app
from app.models.events import EventCreate
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
    db.metadata = events_metadata
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    yield engine

    # Restore original engine and metadata
    db.engine = original_engine
    db.metadata = original_metadata
    events_db.engine = original_engine
    users_db.engine = original_engine
    categories_db.engine = original_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Reset the database before each test."""
    async with test_engine.begin() as conn:
        # Drop and create all tables in the correct order
        await conn.run_sync(events_metadata.drop_all)
        await conn.run_sync(categories_metadata.drop_all)
        await conn.run_sync(users_metadata.drop_all)

        await conn.run_sync(users_metadata.create_all)
        await conn.run_sync(categories_metadata.create_all)
        await conn.run_sync(events_metadata.create_all)
    yield


@pytest_asyncio.fixture
async def test_client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with an SQLite database."""
    transport = ASGITransport(app=event_manager_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_user() -> UUID:
    """Create a test user and return the user_id."""
    user = UserCreate(
        first_name="Test",
        last_name="User",
        date_of_birth=date(1990, 1, 1),
        email="test@example.com",
        color="blue",
    )
    user_read = await users_db.create_user_db(user)
    return user_read.user_id


@pytest_asyncio.fixture
async def test_category() -> UUID:
    """Create a test category and return the category_id."""
    category_id = await categories_db.create_category_db(
        category_name="Test Category", description="A test category for events"
    )
    return category_id


@pytest_asyncio.fixture
async def valid_event_data(test_user: UUID, test_category: UUID) -> EventCreate:
    """Return valid event data for testing with real user and category IDs."""
    now = datetime.now(UTC)
    return EventCreate(
        event_name="Test Event",
        event_datetime=now + timedelta(days=7),
        event_endtime=now + timedelta(days=7, hours=2),
        event_location="Test Location",
        description="Test Description",
        picture_url="https://example.com/picture.jpg",
        capacity=100,
        price_field=10,
        user_id=test_user,
        category_id=test_category,
    )


@pytest.mark.asyncio
async def test_create_event_success(test_client: AsyncClient, valid_event_data: EventCreate):
    """Test successful event creation."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201

    data = response.json()
    assert data["event_name"] == valid_event_data.event_name
    assert data["event_location"] == valid_event_data.event_location
    assert data["description"] == valid_event_data.description
    assert data["capacity"] == valid_event_data.capacity
    assert data["price_field"] == valid_event_data.price_field
    assert UUID(data["event_id"])
    assert UUID(data["user_id"])
    assert UUID(data["category_id"])
    assert datetime.fromisoformat(data["created_at"])
    assert datetime.fromisoformat(data["updated_at"])


@pytest.mark.asyncio
async def test_create_event_with_required_fields(
    test_client: AsyncClient, test_user: UUID, test_category: UUID
):
    """Test creating an event with only required fields."""
    now = datetime.now(UTC)
    minimal_event = {
        "event_name": "Minimal Event",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": (now + timedelta(days=1, hours=1)).isoformat(),
        "user_id": str(test_user),
        "category_id": str(test_category),
    }

    response = await test_client.post("/events", json=minimal_event)
    assert response.status_code == 201

    data = response.json()
    assert data["event_name"] == "Minimal Event"
    assert data["event_location"] is None
    assert data["description"] is None
    assert data["capacity"] is None
    assert data["price_field"] is None
    assert UUID(data["event_id"])
    assert UUID(data["user_id"])
    assert UUID(data["category_id"])
    assert datetime.fromisoformat(data["created_at"])
    assert datetime.fromisoformat(data["updated_at"])


@pytest.mark.asyncio
async def test_list_events_empty(test_client: AsyncClient):
    """Test listing events when database is empty."""
    response = await test_client.get("/events")
    assert response.status_code == 200

    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] == 100


@pytest.mark.asyncio
async def test_list_events_with_data(
    test_client: AsyncClient, test_user: UUID, test_category: UUID
):
    """Test listing events with data in the database."""
    now = datetime.now(UTC)

    event = EventCreate(
        event_name="Party Event",
        event_datetime=now + timedelta(days=1),
        event_endtime=now + timedelta(days=1, hours=2),
        event_location="Location 1",
        description="Description 1",
        picture_url="https://example.com/pic1.jpg",
        capacity=50,
        price_field=20,
        user_id=test_user,
        category_id=test_category,
    )

    await test_client.post("/events", json=event.model_dump(mode="json"))

    response = await test_client.get("/events")
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_name"] == "Party Event"
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_events_with_filter_eq(
    test_client: AsyncClient, test_user: UUID, test_category: UUID
):
    """Test listing events with equality filter."""
    now = datetime.now(UTC)

    event = EventCreate(
        event_name="Party Event",
        event_datetime=now + timedelta(days=1),
        event_endtime=now + timedelta(days=1, hours=2),
        event_location="Location 1",
        description="Description 1",
        picture_url="https://example.com/pic1.jpg",
        capacity=50,
        price_field=20,
        user_id=test_user,
        category_id=test_category,
    )

    await test_client.post("/events", json=event.model_dump(mode="json"))

    response = await test_client.get("/events", params={"filter": "event_name:eq:Party Event"})
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_name"] == "Party Event"
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_events_with_filter_ilike(
    test_client: AsyncClient, test_user: UUID, test_category: UUID
):
    """Test listing events with case-insensitive LIKE filter."""
    now = datetime.now(UTC)

    event = EventCreate(
        event_name="Party Event",
        event_datetime=now + timedelta(days=1),
        event_endtime=now + timedelta(days=1, hours=2),
        event_location="Location 1",
        description="Description 1",
        picture_url="https://example.com/pic1.jpg",
        capacity=50,
        price_field=20,
        user_id=test_user,
        category_id=test_category,
    )

    await test_client.post("/events", json=event.model_dump(mode="json"))

    response = await test_client.get("/events", params={"filter": "event_name:ilike:party%"})
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_name"] == "Party Event"


@pytest.mark.asyncio
async def test_delete_event_success(test_client: AsyncClient, valid_event_data: EventCreate):
    """Test successful event deletion."""
    create_response = await test_client.post(
        "/events", json=valid_event_data.model_dump(mode="json")
    )
    assert create_response.status_code == 201
    event_id = create_response.json()["event_id"]

    delete_response = await test_client.delete(f"/events/{event_id}")
    assert delete_response.status_code == 200

    data = delete_response.json()
    assert data["event_id"] == event_id
    assert data["event_name"] == valid_event_data.event_name

    list_response = await test_client.get(
        "/events", params={"filter": f"event_id:eq:{event_id}"}
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["items"]) == 0


@pytest.mark.asyncio
async def test_delete_event_returns_event_data(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test that delete returns the deleted event data."""
    create_response = await test_client.post(
        "/events", json=valid_event_data.model_dump(mode="json")
    )
    event_id = create_response.json()["event_id"]

    delete_response = await test_client.delete(f"/events/{event_id}")
    assert delete_response.status_code == 200

    data = delete_response.json()
    assert data["event_name"] == valid_event_data.event_name
    assert data["event_location"] == valid_event_data.event_location
    assert data["description"] == valid_event_data.description
    assert data["capacity"] == valid_event_data.capacity
    assert data["price_field"] == valid_event_data.price_field
