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

    # Store original engine
    original_engine = db.engine

    # Set test database config
    db.engine = engine
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    yield engine

    # Restore original engine
    db.engine = original_engine
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
    assert "attendee_count" in data["items"][0]
    assert data["items"][0]["attendee_count"] == 0


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

    response = await test_client.get(
        "/events", params={"filter_expression": "event_name:eq:Party Event"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_name"] == "Party Event"
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_events_attendee_count_reflects_attendees(
    test_client: AsyncClient, test_user: UUID, test_category: UUID
):
    """attendee_count in the events list should match the number of RSVPs."""
    now = datetime.now(UTC)

    event = EventCreate(
        event_name="Counted Event",
        event_datetime=now + timedelta(days=1),
        event_endtime=now + timedelta(days=1, hours=2),
        event_location="Location 2",
        description="Has attendees",
        picture_url="https://example.com/pic-counted.jpg",
        capacity=10,
        price_field=0,
        user_id=test_user,
        category_id=test_category,
    )
    event_resp = await test_client.post("/events", json=event.model_dump(mode="json"))
    assert event_resp.status_code == 201
    event_id = event_resp.json()["event_id"]

    attendee_ids: list[str] = []
    for email in ["ev-att-1@example.com", "ev-att-2@example.com"]:
        user_resp = await test_client.post(
            "/users",
            json={
                "first_name": "Att",
                "last_name": "User",
                "email": email,
                "date_of_birth": "1990-01-01",
            },
        )
        assert user_resp.status_code in (200, 201)
        uid = user_resp.json()["user_id"]
        attendee_ids.append(uid)

        rsvp_resp = await test_client.post(
            "/attendees",
            json={"event_id": event_id, "user_id": uid, "status": "RSVPed"},
        )
        assert rsvp_resp.status_code == 201

    list_resp = await test_client.get("/events")
    assert list_resp.status_code == 200
    data = list_resp.json()
    items = data["items"]

    matched = [e for e in items if e["event_id"] == event_id]
    assert len(matched) == 1
    event_json = matched[0]

    assert "attendee_count" in event_json
    assert event_json["attendee_count"] == 2


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

    response = await test_client.get(
        "/events", params={"filter_expression": "event_name:ilike:party%"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_name"] == "Party Event"


@pytest.mark.asyncio
async def test_patch_event_single_field_name(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching a single event field - event_name."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {
        "patch": {
            event_id: {"op": "replace", "path": "/event_name", "value": "Updated Event Name"}
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert event_id in data
    assert data[event_id]["event_name"] == "Updated Event Name"
    assert data[event_id]["event_location"] == valid_event_data.event_location


@pytest.mark.asyncio
async def test_patch_event_single_field_location(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching a single event field - event_location."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {
        "patch": {
            event_id: {
                "op": "replace",
                "path": "/event_location",
                "value": "Updated Event Location",
            }
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert data[event_id]["event_location"] == "Updated Event Location"
    assert data[event_id]["event_name"] == valid_event_data.event_name  # Unchanged


@pytest.mark.asyncio
async def test_patch_event_description(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching event description."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data = {
        "patch": {
            event_id: {
                "op": "replace",
                "path": "/description",
                "value": "This is an updated event description",
            }
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert data[event_id]["description"] == "This is an updated event description"


@pytest.mark.asyncio
async def test_patch_event_capacity_and_price(
    test_client: AsyncClient, valid_event_data: EventCreate
):
    """Test patching event capacity and price field."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    patch_data: dict[str, Any] = {
        "patch": {event_id: {"op": "replace", "path": "/capacity", "value": 500}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert data[event_id]["capacity"] == 500

    patch_data: dict[str, Any] = {
        "patch": {event_id: {"op": "replace", "path": "/price_field", "value": 76}}
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert data[event_id]["price_field"] == 76


@pytest.mark.asyncio
async def test_patch_event_dates(test_client: AsyncClient, valid_event_data: EventCreate):
    """Test patching event dates."""
    response = await test_client.post("/events", json=valid_event_data.model_dump(mode="json"))
    assert response.status_code == 201
    event = response.json()
    event_id = event["event_id"]

    new_start_date = datetime.now(UTC) + timedelta(days=14)
    new_end_date = new_start_date + timedelta(hours=3)

    patch_data = {
        "patch": {
            event_id: {
                "op": "replace",
                "path": "/event_endtime",
                "value": new_end_date.isoformat(),
            }
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    patch_data = {
        "patch": {
            event_id: {
                "op": "replace",
                "path": "/event_datetime",
                "value": new_start_date.isoformat(),
            }
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    returned_start = datetime.fromisoformat(data[event_id]["event_datetime"])
    returned_end = datetime.fromisoformat(data[event_id]["event_endtime"])

    if returned_start.tzinfo is None:
        expected_start = new_start_date.replace(tzinfo=None)
        expected_end = new_end_date.replace(tzinfo=None)
    else:
        expected_start = new_start_date
        expected_end = new_end_date

    assert returned_start == expected_start
    assert returned_end == expected_end


@pytest.mark.asyncio
async def test_patch_multiple_events(test_client: AsyncClient, valid_event_data: EventCreate):
    """Test patching multiple events in a single request."""
    event1_data = valid_event_data.model_copy()
    event1_data.event_name = "Event 1"
    event1_data.capacity = 100

    event2_data = valid_event_data.model_copy()
    event2_data.event_name = "Event 2"
    event2_data.capacity = 200

    response1 = await test_client.post("/events", json=event1_data.model_dump(mode="json"))
    response2 = await test_client.post("/events", json=event2_data.model_dump(mode="json"))
    assert response1.status_code == 201
    assert response2.status_code == 201

    event1 = response1.json()
    event2 = response2.json()

    patch_data: dict[str, Any] = {
        "patch": {
            event1["event_id"]: {"op": "replace", "path": "/capacity", "value": 150},
            event2["event_id"]: {"op": "replace", "path": "/capacity", "value": 250},
        }
    }

    response = await test_client.patch("/events", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert data[event1["event_id"]]["capacity"] == 150
    assert data[event2["event_id"]]["capacity"] == 250


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
        "/events", params={"filter_expression": f"event_id:eq:{event_id}"}
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
