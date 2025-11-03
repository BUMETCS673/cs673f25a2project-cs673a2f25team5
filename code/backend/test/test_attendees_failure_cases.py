"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import MetaData
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
    """Create a temp SQLite file and return (url, path)."""
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

    # stash originals
    orig_engine = db.engine
    orig_meta = db.metadata
    orig_att = attendees_db.engine
    orig_evt = events_db.engine
    orig_usr = users_db.engine
    orig_cat = categories_db.engine

    # rebind engines for all related modules
    db.engine = engine
    combined_md = MetaData()
    for md in [attendees_md, categories_md, events_md, users_md]:
        for table in md.tables.values():
            table.to_metadata(combined_md)
    db.metadata = combined_md

    attendees_db.engine = engine
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    try:
        yield engine
    finally:
        # restore originals
        db.engine = orig_engine
        db.metadata = orig_meta
        attendees_db.engine = orig_att
        events_db.engine = orig_evt
        users_db.engine = orig_usr
        categories_db.engine = orig_cat

        # close all connections before deleting file
        await engine.dispose()
        try:
            os.remove(path)
        except PermissionError:
            pass


@pytest_asyncio.fixture(autouse=True)
async def setup_schema(test_engine: AsyncEngine):
    """Resets DB schema before each test"""
    async with test_engine.begin() as conn:
        await conn.run_sync(attendees_md.drop_all)
        await conn.run_sync(events_md.drop_all)
        await conn.run_sync(categories_md.drop_all)
        await conn.run_sync(users_md.drop_all)

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


@pytest.mark.asyncio
async def test_create_attendee_404_missing_refs(client: AsyncClient):
    """Verifies API returns 404 if event/user IDs don't exist"""
    r = await client.post(
        "/attendees",
        json={"event_id": str(uuid4()), "user_id": str(uuid4()), "status": "RSVPed"},
    )
    assert r.status_code == 404
    detail = r.json().get("detail", "")
    assert detail, "Expected error detail message"

    assert "no such" in detail.lower(), f"Unexpected detail: {detail}"


@pytest.mark.asyncio
async def test_post_attendee_invalid_uuid_422(client: AsyncClient):
    """Invalid UUIDs in body → 422"""
    r = await client.post(
        "/attendees",
        json={"event_id": "not-a-uuid", "user_id": "123", "status": "RSVPed"},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_post_attendee_missing_fields_422(client: AsyncClient):
    """Missing required fields → 422"""
    r = await client.post("/attendees", json={})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_post_attendee_duplicate_409(client: AsyncClient):
    """Same (event_id, user_id) twice → 409"""
    # seed a valid user + event
    ur = await client.post(
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
    er = await client.post(
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

    r1 = await client.post(
        "/attendees", json={"event_id": eid, "user_id": uid, "status": "RSVPed"}
    )
    assert r1.status_code == 201

    r2 = await client.post(
        "/attendees", json={"event_id": eid, "user_id": uid, "status": "RSVPed"}
    )
    assert r2.status_code == 409
    detail = r2.json().get("detail", "")
    assert detail and any(k in detail.lower() for k in ["already", "duplicate", "exists"])


@pytest.mark.asyncio
async def test_get_attendees_invalid_filter_400(client: AsyncClient):
    """Tests invalid filter expression in query params"""
    r = await client.get("/attendees", params={"filter_expression": "invalid"})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_get_attendees_bad_pagination_types_422(client: AsyncClient):
    """Non-integer offset/limit → 422"""
    r1 = await client.get("/attendees", params={"offset": "oops"})
    r2 = await client.get("/attendees", params={"limit": "NaN"})
    assert r1.status_code == 422
    assert r2.status_code == 422


@pytest.mark.asyncio
async def test_delete_attendee_invalid_uuid_422(client: AsyncClient):
    """Invalid path UUID → 422"""
    r = await client.delete("/attendees/not-a-uuid")
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_delete_attendee_nonexistent_404(client: AsyncClient):
    """Nonexistent attendee → 404"""
    r = await client.delete(f"/attendees/{uuid4()}")
    assert r.status_code == 404
    detail = r.json().get("detail", "")
    assert detail and any(k in detail.lower() for k in ["no such", "not found", "does not"])
