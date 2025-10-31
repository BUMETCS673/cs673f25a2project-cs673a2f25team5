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
from app.db.attendees import metadata as attendees_md
from app.db.categories import metadata as categories_md
from app.db.events import metadata as events_md
from app.db.users import metadata as users_md
from app.main import event_manager_app


@pytest.fixture(scope="session")
def test_db_file() -> Generator[tuple[str, str], None, None]:
    """Create a temp SQLite file and return (url, path). Do NOT delete here."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    url = f"sqlite+aiosqlite:///{path}"
    yield (url, path)


@pytest_asyncio.fixture(scope="session")
async def test_engine(test_db_file) -> AsyncGenerator[AsyncEngine, None]:
    url, path = test_db_file
    engine = create_async_engine(
        url,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # stash originals so we can restore after the session
    orig_engine = db.engine
    orig_meta = db.metadata
    orig_att = attendees_db.engine
    orig_evt = events_db.engine
    orig_usr = users_db.engine
    orig_cat = categories_db.engine

    # point all module engines at the same test engine
    db.engine = engine
    db.metadata = attendees_md
    attendees_db.engine = engine
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    try:
        yield engine
    finally:
        # restore originals first
        db.engine = orig_engine
        db.metadata = orig_meta
        attendees_db.engine = orig_att
        events_db.engine = orig_evt
        users_db.engine = orig_usr
        categories_db.engine = orig_cat

        # fully close connections before deleting the file
        await engine.dispose()
        try:
            os.remove(path)
        except PermissionError:
            # Occasionally Windows still holds a lock for a moment.
            pass


@pytest_asyncio.fixture(autouse=True)
async def setup_schema(test_engine: AsyncEngine):
    async with test_engine.begin() as conn:
        # drop reverse-dep order / create dep order
        await conn.run_sync(attendees_md.drop_all)
        await conn.run_sync(events_md.drop_all)
        await conn.run_sync(categories_md.drop_all)
        await conn.run_sync(users_md.drop_all)
        # create in dependency order
        await conn.run_sync(users_md.create_all)
        await conn.run_sync(categories_md.create_all)
        await conn.run_sync(events_md.create_all)
        await conn.run_sync(attendees_md.create_all)
    yield


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with an SQLite database."""
    transport = ASGITransport(app=event_manager_app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def _seed_category() -> UUID:
    """Creates a sample “Tech” category for testing"""
    return await categories_db.create_category_db("Tech", "Meetups & talks")


async def _seed_user(client: AsyncClient) -> UUID:
    """Registers a test user via /users API and returns the user ID"""
    r = await client.post(
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


async def _seed_event(client: AsyncClient, user_id: UUID, category_id: UUID) -> UUID:
    """Creates a future event linked to the test user and category"""
    start = datetime.now(UTC) + timedelta(days=3)
    end = start + timedelta(hours=2)
    r = await client.post(
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
async def test_post_attendee_minimal_defaults_status_null(client: AsyncClient):
    """Create attendee WITHOUT status;
    service should persist status as NULL (no response yet)."""
    cat_id = await _seed_category()
    user_id = await _seed_user(client)
    event_id = await _seed_event(client, user_id, cat_id)

    resp = await client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert UUID(body["attendee_id"])
    # Depending on response config, NULL may appear as None or be omitted
    if "status" in body:
        assert body["status"] is None


@pytest.mark.asyncio
async def test_post_attendee_with_explicit_status_rsvped(client: AsyncClient):
    """Create attendee WITH explicit status."""
    cat_id = await _seed_category()
    user_id = await _seed_user(client)
    event_id = await _seed_event(client, user_id, cat_id)

    resp = await client.post(
        "/attendees",
        json={
            "event_id": str(event_id),
            "user_id": str(user_id),
            "status": "RSVPed",
        },
    )
    assert resp.status_code in (200, 201)
    body = resp.json()
    assert (
        body.get("status", "RSVPed").upper().startswith("RSVP")
    )  # tolerant to enum serialization


@pytest.mark.asyncio
async def test_get_attendees_empty_initially(client: AsyncClient):
    """Empty list when no attendees exist."""
    resp = await client.get("/attendees")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] > 0


@pytest.mark.asyncio
async def test_get_attendees_by_event_filter_eq(client: AsyncClient):
    """List attendees filtered by event_id:eq:<id> returns the created attendee."""
    cat_id = await _seed_category()
    user_id = await _seed_user(client)
    event_id = await _seed_event(client, user_id, cat_id)

    created = await client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    assert created.status_code in (200, 201)
    att_id = created.json()["attendee_id"]

    resp = await client.get(
        "/attendees",
        params={"filter_expression": f"event_id:eq:{event_id}", "offset": 0, "limit": 50},
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(i["attendee_id"] == att_id for i in items)


@pytest.mark.asyncio
async def test_get_attendees_pagination(client: AsyncClient):
    """Pagination returns correct slices and totals."""
    cat_id = await _seed_category()
    user_id = await _seed_user(client)
    event_id = await _seed_event(client, user_id, cat_id)

    # create 3 attendees (distinct users)
    emails = ["u1@example.com", "u2@example.com", "u3@example.com"]
    user_ids = []
    for e in emails:
        r = await client.post(
            "/users",
            json={
                "first_name": "U",
                "last_name": "X",
                "email": e,
                "date_of_birth": "1990-01-01",
            },
        )
        user_ids.append(r.json()["user_id"])
        await client.post(
            "/attendees", json={"event_id": str(event_id), "user_id": user_ids[-1]}
        )

    # page 1 (limit 2)
    p1 = await client.get("/attendees", params={"offset": 0, "limit": 2})
    assert p1.status_code == 200
    d1 = p1.json()
    assert len(d1["items"]) == 2
    assert d1["total"] == 3

    # page 2 (limit 2)
    p2 = await client.get("/attendees", params={"offset": 2, "limit": 2})
    assert p2.status_code == 200
    d2 = p2.json()
    assert len(d2["items"]) == 1
    assert d2["total"] == 3


@pytest.mark.asyncio
async def test_delete_attendee_success(client: AsyncClient):
    """Delete returns 200/204 and attendee disappears from listings."""
    cat_id = await _seed_category()
    user_id = await _seed_user(client)
    event_id = await _seed_event(client, user_id, cat_id)

    created = await client.post(
        "/attendees", json={"event_id": str(event_id), "user_id": str(user_id)}
    )
    att_id = created.json()["attendee_id"]

    dele = await client.delete(f"/attendees/{att_id}")
    assert dele.status_code in (200, 204)

    after = await client.get(
        "/attendees", params={"filter_expression": f"attendee_id:eq:{att_id}"}
    )
    assert after.status_code == 200
    assert len(after.json()["items"]) == 0
