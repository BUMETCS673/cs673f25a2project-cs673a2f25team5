"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

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
async def test_create_event_nonexistent_user(test_client: AsyncClient):
    """Test that creating an event with a nonexistent user fails."""
    now = datetime.now(UTC)
    invalid_event = {
        "event_name": "Invalid Event",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": (now + timedelta(days=7, hours=2)).isoformat(),
        "user_id": str(uuid4()),
        "category_id": str(uuid4()),
    }

    response = await test_client.post("/events", json=invalid_event)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_event_nonexistent_category(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test that creating an event with a nonexistent category fails."""
    now = datetime.now(UTC)
    invalid_event: dict[str, Any] = {
        "event_name": "Invalid Event",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": (now + timedelta(days=7, hours=2)).isoformat(),
        "user_id": str(valid_event_data.user_id),
        "category_id": str(uuid4()),
    }

    response = await test_client.post("/events", json=invalid_event)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_event_invalid_times(test_client: AsyncClient):
    """Test that creating an event with end time before start time fails."""
    now = datetime.now(UTC)
    invalid_event = {
        "event_name": "Invalid Event",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": now.isoformat(),
        "user_id": str(uuid4()),
        "category_id": str(uuid4()),
    }

    response = await test_client.post("/events", json=invalid_event)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_event_invalid_capacity(test_client: AsyncClient):
    """Test that creating an event with negative capacity fails."""
    now = datetime.now(UTC)
    invalid_event: dict[str, Any] = {
        "event_name": "Invalid Capacity Event",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": (now + timedelta(days=1, hours=1)).isoformat(),
        "capacity": -10,
        "user_id": str(uuid4()),
        "category_id": str(uuid4()),
    }

    response = await test_client.post("/events", json=invalid_event)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_event_invalid_price(test_client: AsyncClient):
    """Test that creating an event with negative price fails."""
    now = datetime.now(UTC)
    invalid_event: dict[str, Any] = {
        "event_name": "Invalid Price Event",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": (now + timedelta(days=1, hours=1)).isoformat(),
        "price_field": -100,
        "user_id": str(uuid4()),
        "category_id": str(uuid4()),
    }

    response = await test_client.post("/events", json=invalid_event)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_event_empty_name(test_client: AsyncClient):
    """Test that creating an event with empty name fails."""
    now = datetime.now(UTC)
    invalid_event = {
        "event_name": "   ",
        "event_datetime": (now + timedelta(days=1)).isoformat(),
        "event_endtime": (now + timedelta(days=1, hours=1)).isoformat(),
        "user_id": str(uuid4()),
        "category_id": str(uuid4()),
    }

    response = await test_client.post("/events", json=invalid_event)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_events_invalid_filter_format(test_client: AsyncClient):
    """Test that invalid filter format returns 400."""
    response = await test_client.get("/events", params={"filter_expression": "invalid_format"})
    assert response.status_code == 400
    assert "filter_expression format" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_events_invalid_column(test_client: AsyncClient):
    """Test that invalid column name returns 400."""
    response = await test_client.get(
        "/events", params={"filter_expression": "invalid_column:eq:value"}
    )
    assert response.status_code == 400
    assert "column" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_events_invalid_operator(test_client: AsyncClient):
    """Test that invalid operator returns 400."""
    response = await test_client.get(
        "/events", params={"filter_expression": "event_name:invalid_op:value"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_events_invalid_uuid_filter(test_client: AsyncClient):
    """Test that invalid UUID in filter returns 400."""
    response = await test_client.get(
        "/events", params={"filter_expression": "event_id:eq:not-a-uuid"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_events_negative_offset(test_client: AsyncClient):
    """Test that negative offset is rejected."""
    response = await test_client.get("/events", params={"offset": -1})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_events_zero_limit(test_client: AsyncClient):
    """Test that zero limit is rejected."""
    response = await test_client.get("/events", params={"limit": 0})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_events_limit_exceeds_maximum(test_client: AsyncClient):
    """Test that limit exceeding maximum is rejected."""
    response = await test_client.get("/events", params={"limit": 1001})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_event_nonexistent_id(test_client: AsyncClient):
    """Test patching a non-existent event."""
    fake_uuid = "12345678-1234-4321-1234-123456789012"
    patch_data = {
        "patch": {fake_uuid: {"op": "replace", "path": "/event_name", "value": "Updated Name"}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_event_invalid_field_path(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with invalid field path."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {
        "patch": {event_id: {"op": "replace", "path": "/invalid_field", "value": "some_value"}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_event_invalid_user_id(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with non-existent user_id."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    fake_user_uuid = "12345678-1234-4321-1234-123456789012"
    patch_data = {
        "patch": {event_id: {"op": "replace", "path": "/user_id", "value": fake_user_uuid}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_event_invalid_category_id(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with non-existent category_id."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    fake_category_id = "12345678-1234-4321-1234-123456789012"
    patch_data = {
        "patch": {
            event_id: {"op": "replace", "path": "/category_id", "value": fake_category_id}
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_event_invalid_date_format(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with invalid date format."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {
        "patch": {
            event_id: {"op": "replace", "path": "/start_date", "value": "invalid-date-format"}
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_event_negative_capacity(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with negative capacity."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data: dict[str, Any] = {
        "patch": {event_id: {"op": "replace", "path": "/capacity", "value": -10}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_event_negative_price(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with negative price."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data: dict[str, Any] = {
        "patch": {event_id: {"op": "replace", "path": "/price_field", "value": -5.99}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_event_empty_name(test_client: AsyncClient, valid_event_data: EventCreate):
    """Test patching with empty event name."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {"patch": {event_id: {"op": "replace", "path": "/event_name", "value": ""}}}

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_event_end_date_before_start_date(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with end date before start date."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    past_date = datetime.now(UTC) - timedelta(days=1)

    patch_data = {
        "patch": {
            event_id: {"op": "replace", "path": "/end_date", "value": past_date.isoformat()}
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_event_invalid_operation(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching with unsupported operation."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {
        "patch": {event_id: {"op": "add", "path": "/event_name", "value": "New Name"}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_event_malformed_patch_data(test_client: AsyncClient):
    """Test patching with malformed patch data."""
    patch_data = {
        "patch": {
            "some-id": {
                "path": "/event_name",
                "value": "New Name",
                # Missing "op" field
            }
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_nonexistent_event(test_client: AsyncClient):
    """Test deleting a non-existent event returns 404."""
    non_existent_id = uuid4()
    response = await test_client.delete(f"/events/{non_existent_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_event_invalid_uuid(test_client: AsyncClient):
    """Test deleting with invalid UUID format returns 422."""
    response = await test_client.delete("/events/not-a-valid-uuid")
    assert response.status_code == 422
