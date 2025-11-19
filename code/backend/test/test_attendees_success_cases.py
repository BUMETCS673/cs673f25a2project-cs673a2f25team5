"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import UTC, datetime, timedelta
from uuid import UUID

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

    # Store original engine
    original_engine = db.engine

    # Set test database config
    db.engine = engine
    attendees_db.engine = engine
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    yield engine

    # Restore original engine
    db.engine = original_engine
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


async def _seed_category() -> UUID:
    """Creates a sample “Tech” category for testing"""
    return await categories_db.create_category_db("Tech", "Meetups & talks")


async def _seed_user(test_client: AsyncClient) -> UUID:
    """Registers a test user via /users API and returns the user ID"""
    r = await test_client.post(
        "/users",
        json={
            "first_name": "Alice",
            "last_name": "Tester",
            "email": "alice.attendee@example.com",
            "date_of_birth": "1995-05-05",
        },
    )
    r.raise_for_status()
    return UUID(r.json()["user_id"])


async def _seed_event(test_client: AsyncClient, user_id: UUID, category_id: UUID) -> UUID:
    """Creates a future event linked to the test user and category"""
    start = datetime.now(UTC) + timedelta(days=3)
    end = start + timedelta(hours=2)
    r = await test_client.post(
        "/events",
        json={
            "event_name": "Attendee Happy Path",
            "event_datetime": start.isoformat(),
            "event_endtime": end.isoformat(),
            "event_location": "Boston",
            "capacity": 10,
            "price_field": 0,
            "user_id": str(user_id),
            "category_id": str(category_id),
        },
    )
    assert r.status_code in (200, 201)
    return UUID(r.json()["event_id"])


@pytest.mark.asyncio
async def test_post_attendee_minimal_defaults_status_null(test_client: AsyncClient):
    """Create attendee WITHOUT status;
    service should persist status as NULL (no response yet)."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    resp = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert UUID(body["attendee_id"])
    # Depending on response config, NULL may appear as None or be omitted
    if "status" in body:
        assert body["status"] is None


@pytest.mark.asyncio
async def test_post_attendee_with_explicit_status_rsvped(test_client: AsyncClient):
    """Create attendee WITH explicit status."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    resp = await test_client.post(
        "/attendees",
        json={
            "event_id": str(event_id),
            "user_id": str(user_id),
            "status": "RSVPed",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert (
        body.get("status", "RSVPed").upper().startswith("RSVP")
    )  # tolerant to enum serialization


@pytest.mark.asyncio
async def test_get_attendees_empty_initially(test_client: AsyncClient):
    """Empty list when no attendees exist."""
    resp = await test_client.get("/attendees")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] > 0


@pytest.mark.asyncio
async def test_get_attendees_by_event_filter_eq(test_client: AsyncClient):
    """List attendees filtered by event_id:eq:<id> returns the created attendee."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    created = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    assert created.status_code == 201
    att_id = created.json()["attendee_id"]

    resp = await test_client.get(
        "/attendees",
        params={"filter_expression": f"event_id:eq:{event_id}", "offset": 0, "limit": 50},
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(i["attendee_id"] == att_id for i in items)


@pytest.mark.asyncio
async def test_get_attendees_pagination(test_client: AsyncClient):
    """Pagination returns correct slices and totals."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    # create 3 attendees (distinct users)
    emails = ["u1@example.com", "u2@example.com", "u3@example.com"]
    user_ids: list[str] = []
    for e in emails:
        r = await test_client.post(
            "/users",
            json={
                "first_name": "U",
                "last_name": "X",
                "email": e,
                "date_of_birth": "1990-01-01",
            },
        )
        user_ids.append(r.json()["user_id"])
        await test_client.post(
            "/attendees", json={"event_id": str(event_id), "user_id": user_ids[-1]}
        )

    # page 1 (limit 2)
    p1 = await test_client.get("/attendees", params={"offset": 0, "limit": 2})
    assert p1.status_code == 200
    d1 = p1.json()
    assert len(d1["items"]) == 2
    assert d1["total"] == 3

    # page 2 (limit 2)
    p2 = await test_client.get("/attendees", params={"offset": 2, "limit": 2})
    assert p2.status_code == 200
    d2 = p2.json()
    assert len(d2["items"]) == 1
    assert d2["total"] == 3


@pytest.mark.asyncio
async def test_delete_attendee_success(test_client: AsyncClient):
    """Delete returns 200/204 and attendee disappears from listings."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    created = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    assert created.status_code == 201
    att_id = created.json()["attendee_id"]

    dele = await test_client.delete(f"/attendees/{att_id}")
    assert dele.status_code in (200, 204)

    after = await test_client.get(
        "/attendees", params={"filter_expression": f"attendee_id:eq:{att_id}"}
    )
    assert after.status_code == 200
    assert len(after.json()["items"]) == 0


@pytest.mark.asyncio
async def test_patch_attendee_single_field_status(test_client: AsyncClient):
    """Test patching a single attendee field - status."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    response = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    assert response.status_code == 201
    attendee = response.json()
    attendee_id = attendee["attendee_id"]

    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/status", "value": "RSVPed"}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert attendee_id in data
    assert data[attendee_id]["status"] == "RSVPed"
    assert data[attendee_id]["event_id"] == str(event_id)
    assert data[attendee_id]["user_id"] == str(user_id)


@pytest.mark.asyncio
async def test_patch_attendee_status_to_null(test_client: AsyncClient):
    """Test patching attendee status back to null."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id = await _seed_event(test_client, user_id, cat_id)

    response = await test_client.post(
        "/attendees",
        json={"event_id": str(event_id), "user_id": str(user_id), "status": "RSVPed"},
    )
    assert response.status_code == 201
    attendee = response.json()
    attendee_id = attendee["attendee_id"]

    patch_data: dict[str, dict[str, dict[str, str | None]]] = {
        "patch": {attendee_id: {"op": "replace", "path": "/status", "value": None}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert attendee_id in data
    assert data[attendee_id].get("status") is None


@pytest.mark.asyncio
async def test_patch_attendee_user_id(test_client: AsyncClient):
    """Test patching attendee user_id to reference a different user."""
    cat_id = await _seed_category()
    user_id1 = await _seed_user(test_client)

    user_id2_response = await test_client.post(
        "/users",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane.doe@example.com",
            "date_of_birth": "1991-01-01",
        },
    )
    assert user_id2_response.status_code == 201
    user_id2 = UUID(user_id2_response.json()["user_id"])

    event_id = await _seed_event(test_client, user_id1, cat_id)

    response = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id1)}
    )
    assert response.status_code == 201
    attendee = response.json()
    attendee_id = attendee["attendee_id"]

    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/user_id", "value": str(user_id2)}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert attendee_id in data
    assert data[attendee_id]["user_id"] == str(user_id2)
    assert data[attendee_id]["event_id"] == str(event_id)


@pytest.mark.asyncio
async def test_patch_attendee_event_id(test_client: AsyncClient):
    """Test patching attendee event_id to reference a different event."""
    cat_id = await _seed_category()
    user_id = await _seed_user(test_client)
    event_id1 = await _seed_event(test_client, user_id, cat_id)

    event_id2_response = await test_client.post(
        "/events",
        json={
            "event_name": "Second Event",
            "event_location": "Second Location",
            "event_datetime": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
            "event_endtime": (datetime.now(UTC) + timedelta(days=2, hours=2)).isoformat(),
            "capacity": 20,
            "price_field": 15.0,
            "user_id": str(user_id),
            "category_id": str(cat_id),
        },
    )
    assert event_id2_response.status_code == 201
    event_id2 = UUID(event_id2_response.json()["event_id"])

    response = await test_client.post(
        "/attendees", json={"event_id": str(event_id1), "user_id": str(user_id)}
    )
    assert response.status_code == 201
    attendee = response.json()
    attendee_id = attendee["attendee_id"]

    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/event_id", "value": str(event_id2)}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert attendee_id in data
    assert data[attendee_id]["event_id"] == str(event_id2)
    assert data[attendee_id]["user_id"] == str(user_id)


@pytest.mark.asyncio
async def test_patch_attendee_multiple_fields(test_client: AsyncClient):
    """Test patching multiple fields of a single attendee."""
    cat_id = await _seed_category()
    user_id1 = await _seed_user(test_client)

    user_id2_response = await test_client.post(
        "/users",
        json={
            "first_name": "Bob",
            "last_name": "Smith",
            "email": "bob.smith@example.com",
            "date_of_birth": "1992-01-01",
        },
    )
    assert user_id2_response.status_code == 201
    user_id2 = UUID(user_id2_response.json()["user_id"])

    event_id = await _seed_event(test_client, user_id1, cat_id)

    response = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id1)}
    )
    assert response.status_code == 201
    attendee = response.json()
    attendee_id = attendee["attendee_id"]

    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/user_id", "value": str(user_id2)}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    patch_data = {
        "patch": {attendee_id: {"op": "replace", "path": "/status", "value": "RSVPed"}}
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert attendee_id in data
    assert data[attendee_id]["user_id"] == str(user_id2)
    assert data[attendee_id]["status"] == "RSVPed"
    assert data[attendee_id]["event_id"] == str(event_id)


@pytest.mark.asyncio
async def test_patch_multiple_attendees(test_client: AsyncClient):
    """Test patching multiple attendees in a single request."""
    cat_id = await _seed_category()
    user_id1 = await _seed_user(test_client)

    user_id2_response = await test_client.post(
        "/users",
        json={
            "first_name": "Alice",
            "last_name": "Johnson",
            "email": "alice.johnson@example.com",
            "date_of_birth": "1993-01-01",
        },
    )
    assert user_id2_response.status_code == 201
    user_id2 = UUID(user_id2_response.json()["user_id"])

    event_id = await _seed_event(test_client, user_id1, cat_id)

    response1 = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id1)}
    )
    response2 = await test_client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id2)}
    )
    assert response1.status_code == 201
    assert response2.status_code == 201

    attendee1 = response1.json()
    attendee2 = response2.json()
    attendee_id1 = attendee1["attendee_id"]
    attendee_id2 = attendee2["attendee_id"]

    patch_data = {
        "patch": {
            attendee_id1: {"op": "replace", "path": "/status", "value": "RSVPed"},
            attendee_id2: {"op": "replace", "path": "/status", "value": "Maybe"},
        }
    }

    response = await test_client.patch("/attendees", json=patch_data)
    assert response.status_code == 200

    data = response.json()
    assert attendee_id1 in data
    assert attendee_id2 in data
    assert data[attendee_id1]["status"] == "RSVPed"
    assert data[attendee_id2]["status"] == "Maybe"
