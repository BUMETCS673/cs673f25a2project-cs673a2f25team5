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
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import db
from app.db import attendees as attendees_db
from app.db import events as events_db
from app.db import users as users_db
from app.db import categories as categories_db
from app.db.attendees import metadata as attendees_md
from app.db.events import metadata as events_md
from app.db.users import metadata as users_md
from app.db.categories import metadata as categories_md
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
    db.metadata = attendees_md
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
async def test_duplicate_attendee_409(client: AsyncClient):
    """Checks that registering same user twice causes 409 conflict"""
    ur = await client.post(
        "/users",
        json={
            "first_name": "Bob",
            "last_name": "Dup",
            "email": "bob.dup@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert ur.status_code in (200, 201)
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
    assert er.status_code in (200, 201)
    eid = er.json()["event_id"]

    r1 = await client.post(
        "/attendees", json={"event_id": eid, "user_id": uid, "status": "RSVPed"}
    )
    assert r1.status_code in (200, 201)

    r2 = await client.post(
        "/attendees", json={"event_id": eid, "user_id": uid, "status": "RSVPed"}
    )
    assert r2.status_code == 409
    detail = r2.json().get("detail", "")
    assert detail
    
    assert any(k in detail.lower() for k in ["already", "duplicate", "exists"]), detail


@pytest.mark.asyncio
async def test_list_attendees_invalid_filter_400(client: AsyncClient):
    """Tests invalid filter expression in query params"""
    r = await client.get("/attendees", params={"filter_expression": "invalid"})
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_delete_attendee_404(client: AsyncClient):
    """Checks deleting a non-existent attendee returns 404"""
    r = await client.delete(f"/attendees/{uuid4()}")
    assert r.status_code == 404
    detail = r.json().get("detail", "")
    assert detail
    assert any(k in detail.lower() for k in ["no such", "not found", "does not"]), detail


@pytest.mark.asyncio
async def test_attendee_create_wrong_expectation_demo(client: AsyncClient):
    """
    Intentional failing test for testing purpose.
    We create a valid user/event, then create an attendee but ASSERT the wrong status.
    API returns 200/201 for this — we assert 404 to make it fail on purpose.
    """
    # valid user
    ur = await client.post(
        "/users",
        json={
            "first_name": "Fail",
            "last_name": "Demo",
            "email": "fail.demo@example.com",
            "date_of_birth": "1990-01-01",
        },
    )
    assert ur.status_code in (200, 201)
    uid = ur.json()["user_id"]

    # valid event
    cat_id = await categories_db.create_category_db("DemoFail", "Purposeful fail")
    er = await client.post(
        "/events",
        json={
            "event_name": "Attendee Fail Demo",
            "event_datetime": "2099-01-01T10:00:00Z",
            "event_endtime": "2099-01-01T12:00:00Z",
            "user_id": uid,
            "category_id": str(cat_id),
        },
    )
    assert er.status_code in (200, 201)
    eid = er.json()["event_id"]

    # create attendee (this succeeds but we assert the WRONG thing to force a fail)
    r = await client.post(
        "/attendees",
        json={"event_id": eid, "user_id": uid, "status": "RSVPed"},
    )

    # Intentional wrong expectation:
    assert r.status_code == 404, f"Expected 404 to demo failure, got {r.status_code}"
