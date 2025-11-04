"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import attendees as attendees_db
from app.db import categories as categories_db
from app.db import db
from app.db import events as events_db
from app.db import users as users_db
from app.db.attendees import metadata as attendees_metadata
from app.db.categories import metadata as categories_metadata
from app.db.events import metadata as events_metadata
from app.db.users import metadata as users_metadata
from app.main import event_manager_app


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
    db.metadata = attendees_metadata
    attendees_db.engine = engine
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    yield engine

    # Restore original engine and metadata
    db.engine = original_engine
    db.metadata = original_metadata
    attendees_db.engine = original_engine
    events_db.engine = original_engine
    users_db.engine = original_engine
    categories_db.engine = original_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Reset the database before each test."""
    async with test_engine.begin() as conn:
        # Drop and create all tables in the correct order
        await conn.run_sync(attendees_metadata.drop_all)
        await conn.run_sync(events_metadata.drop_all)
        await conn.run_sync(categories_metadata.drop_all)
        await conn.run_sync(users_metadata.drop_all)

        await conn.run_sync(users_metadata.create_all)
        await conn.run_sync(categories_metadata.create_all)
        await conn.run_sync(events_metadata.create_all)
        await conn.run_sync(attendees_metadata.create_all)
    yield


@pytest_asyncio.fixture
async def test_client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with an SQLite database."""
    transport = ASGITransport(app=event_manager_app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_create_attendee_404_missing_refs(test_client: AsyncClient):
    """Verifies API returns 404 if event/user IDs don't exist"""
    r = await test_client.post(
        "/attendees",
        json={"event_id": str(uuid4()), "user_id": str(uuid4()), "status": "RSVPed"},
    )
    assert r.status_code == 404
    detail = r.json().get("detail", "")
    assert detail, "Expected error detail message"

    assert "no such" in detail.lower(), f"Unexpected detail: {detail}"


@pytest.mark.asyncio
async def test_post_attendee_invalid_uuid_422(test_client: AsyncClient):
    """Invalid UUIDs in body → 422"""
    r = await test_client.post(
        "/attendees",
        json={"event_id": "not-a-uuid", "user_id": "123", "status": "RSVPed"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_post_attendee_missing_fields_422(test_client: AsyncClient):
    """Missing required fields → 422"""
    r = await test_client.post("/attendees", json={})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_post_attendee_duplicate_409(test_client: AsyncClient):
    """Same (event_id, user_id) twice → 409"""
    # seed a valid user + event
    ur = await test_client.post(
        "/users",
        json={
            "first_name": "Bob",
            "last_name": "Dup",
            "email": "dup@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    uid = ur.json()["user_id"]
    cat_id = await categories_db.create_category_db("General", "General")
    er = await test_client.post(
        "/events",
        json={
            "event_name": "Dup Check",
            "event_datetime": "2099-01-01T10:00:00Z",
            "event_endtime": "2099-01-01T12:00:00Z",
            "user_id": uid,
            "category_id": str(cat_id),
        },
    )
    eid = er.json()["event_id"]

    r1 = await test_client.post(
        "/attendees", json={"event_id": eid, "user_id": uid, "status": "RSVPed"}
    )
    assert r1.status_code == 201

    r2 = await test_client.post(
        "/attendees", json={"event_id": eid, "user_id": uid, "status": "RSVPed"}
    )
    assert r2.status_code == 409
    detail = r2.json().get("detail", "")
    assert detail and any(k in detail.lower() for k in ["already", "duplicate", "exists"])


@pytest.mark.asyncio
async def test_get_attendees_invalid_filter_400(test_client: AsyncClient):
    """Tests invalid filter expression in query params"""
    r = await test_client.get("/attendees", params={"filter_expression": "invalid"})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_get_attendees_bad_pagination_types_422(test_client: AsyncClient):
    """Non-integer offset/limit → 422"""
    r1 = await test_client.get("/attendees", params={"offset": "oops"})
    r2 = await test_client.get("/attendees", params={"limit": "NaN"})
    assert r1.status_code == 422
    assert r2.status_code == 422


@pytest.mark.asyncio
async def test_delete_attendee_invalid_uuid_422(test_client: AsyncClient):
    """Invalid path UUID → 422"""
    r = await test_client.delete("/attendees/not-a-uuid")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_delete_attendee_nonexistent_404(test_client: AsyncClient):
    """Nonexistent attendee → 404"""
    r = await test_client.delete(f"/attendees/{uuid4()}")
    assert r.status_code == 404
    detail = r.json().get("detail", "")
    assert detail and any(k in detail.lower() for k in ["no such", "not found", "does not"])


@pytest.mark.asyncio
async def test_patch_attendee_nonexistent_id(test_client: AsyncClient):
    """Test patching a non-existent attendee."""
    fake_uuid = "12345678-1234-4321-1234-123456789012"
    patch_data = {
        "patch": {fake_uuid: {"op": "replace", "path": "/status", "value": "RSVPed"}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_attendee_invalid_field_path(test_client: AsyncClient):
    """Test patching with invalid field path."""
    cat_id = await categories_db.create_category_db(
        "Test Category", "Test Category Description"
    )

    user_response = await test_client.post(
        "/users",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["user_id"]

    event_response = await test_client.post(
        "/events",
        json={
            "event_name": "Test Event",
            "event_location": "Test Location",
            "event_datetime": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "event_endtime": (datetime.now(UTC) + timedelta(days=1, hours=2)).isoformat(),
            "capacity": 10,
            "price_field": 0,
            "user_id": user_id,
            "category_id": str(cat_id),
        },
    )
    assert event_response.status_code == 201
    event_id = event_response.json()["event_id"]

    attendee_response = await test_client.post(
        "/attendees", json={"event_id": event_id, "user_id": user_id}
    )
    assert attendee_response.status_code == 201
    attendee_id = attendee_response.json()["attendee_id"]

    patch_data = {
        "patch": {
            attendee_id: {"op": "replace", "path": "/invalid_field", "value": "some_value"}
        }
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_attendee_invalid_user_id(test_client: AsyncClient):
    """Test patching with non-existent user_id."""
    cat_id = await categories_db.create_category_db(
        "Test Category", "Test Category Description"
    )

    user_response = await test_client.post(
        "/users",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test2@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["user_id"]

    from datetime import UTC, datetime, timedelta

    event_response = await test_client.post(
        "/events",
        json={
            "event_name": "Test Event",
            "event_location": "Test Location",
            "event_datetime": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "event_endtime": (datetime.now(UTC) + timedelta(days=1, hours=2)).isoformat(),
            "capacity": 10,
            "price_field": 0,
            "user_id": user_id,
            "category_id": str(cat_id),
        },
    )
    assert event_response.status_code == 201
    event_id = event_response.json()["event_id"]

    attendee_response = await test_client.post(
        "/attendees", json={"event_id": event_id, "user_id": user_id}
    )
    assert attendee_response.status_code == 201
    attendee_id = attendee_response.json()["attendee_id"]

    fake_user_id = "12345678"
    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/user_id", "value": fake_user_id}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_attendee_invalid_event_id(test_client: AsyncClient):
    """Test patching with non-existent event_id."""
    cat_id = await categories_db.create_category_db(
        "Test Category", "Test Category Description"
    )

    user_response = await test_client.post(
        "/users",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test3@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["user_id"]

    from datetime import UTC, datetime, timedelta

    event_response = await test_client.post(
        "/events",
        json={
            "event_name": "Test Event",
            "event_location": "Test Location",
            "event_datetime": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "event_endtime": (datetime.now(UTC) + timedelta(days=1, hours=2)).isoformat(),
            "capacity": 10,
            "price_field": 0,
            "user_id": user_id,
            "category_id": str(cat_id),
        },
    )
    assert event_response.status_code == 201
    event_id = event_response.json()["event_id"]

    attendee_response = await test_client.post(
        "/attendees", json={"event_id": event_id, "user_id": user_id}
    )
    assert attendee_response.status_code == 201
    attendee_id = attendee_response.json()["attendee_id"]

    fake_event_id = "12345678"
    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/event_id", "value": fake_event_id}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_attendee_invalid_status_value(test_client: AsyncClient):
    """Test patching with invalid status value."""
    cat_id = await categories_db.create_category_db(
        "Test Category", "Test Category Description"
    )

    user_response = await test_client.post(
        "/users",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test4@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["user_id"]

    from datetime import UTC, datetime, timedelta

    event_response = await test_client.post(
        "/events",
        json={
            "event_name": "Test Event",
            "event_location": "Test Location",
            "event_datetime": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "event_endtime": (datetime.now(UTC) + timedelta(days=1, hours=2)).isoformat(),
            "capacity": 10,
            "price_field": 0,
            "user_id": user_id,
            "category_id": str(cat_id),
        },
    )
    assert event_response.status_code == 201
    event_id = event_response.json()["event_id"]

    attendee_response = await test_client.post(
        "/attendees", json={"event_id": event_id, "user_id": user_id}
    )
    assert attendee_response.status_code == 201
    attendee_id = attendee_response.json()["attendee_id"]

    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/status", "value": "InvalidStatus"}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_attendee_invalid_operation(test_client: AsyncClient):
    """Test patching with unsupported operation."""
    cat_id = await categories_db.create_category_db(
        "Test Category", "Test Category Description"
    )

    user_response = await test_client.post(
        "/users",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test5@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["user_id"]

    from datetime import UTC, datetime, timedelta

    event_response = await test_client.post(
        "/events",
        json={
            "event_name": "Test Event",
            "event_location": "Test Location",
            "event_datetime": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "event_endtime": (datetime.now(UTC) + timedelta(days=1, hours=2)).isoformat(),
            "capacity": 10,
            "price_field": 0,
            "user_id": user_id,
            "category_id": str(cat_id),
        },
    )
    assert event_response.status_code == 201
    event_id = event_response.json()["event_id"]

    attendee_response = await test_client.post(
        "/attendees", json={"event_id": event_id, "user_id": user_id}
    )
    assert attendee_response.status_code == 201
    attendee_id = attendee_response.json()["attendee_id"]

    patch_data = {"patch": {attendee_id: {"op": "add", "path": "/status", "value": "RSVPed"}}}

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_attendee_malformed_patch_data(test_client: AsyncClient):
    """Test patching with malformed patch data."""
    malformed_data = {"invalid": "structure"}

    response = await test_client.patch("/attendees", json=malformed_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_attendee_invalid_uuid_format(test_client: AsyncClient):
    """Test patching with invalid UUID format."""
    patch_data = {
        "patch": {"not-a-valid-uuid": {"op": "replace", "path": "/status", "value": "RSVPed"}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 422
