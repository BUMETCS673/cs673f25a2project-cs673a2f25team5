"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from datetime import UTC, date, datetime, timedelta
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import categories as categories_db
from app.db import db
from app.db import events as events_db
from app.db import invitations as invitations_db
from app.db import users as users_db
from app.db.categories import metadata as categories_metadata
from app.db.events import metadata as events_metadata
from app.db.invitations import metadata as invitations_metadata
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
    invitations_db.engine = engine
    events_db.engine = engine
    users_db.engine = engine
    categories_db.engine = engine

    yield engine

    # Restore original engine
    db.engine = original_engine
    invitations_db.engine = original_engine
    events_db.engine = original_engine
    users_db.engine = original_engine
    categories_db.engine = original_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Reset the database before each test."""
    async with test_engine.begin() as conn:
        # Drop and create all tables in the correct order
        await conn.run_sync(invitations_metadata.drop_all)
        await conn.run_sync(events_metadata.drop_all)
        await conn.run_sync(categories_metadata.drop_all)
        await conn.run_sync(users_metadata.drop_all)

        await conn.run_sync(users_metadata.create_all)
        await conn.run_sync(categories_metadata.create_all)
        await conn.run_sync(events_metadata.create_all)
        await conn.run_sync(invitations_metadata.create_all)
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
async def test_event(test_user: UUID, test_category: UUID) -> UUID:
    """Create a test event and return the event_id."""
    now = datetime.now(UTC)
    event = EventCreate(
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
    event_read = await events_db.create_event_db(event)
    return event_read.event_id


@pytest.mark.asyncio
async def test_create_invitation_nonexistent_user(test_client: AsyncClient, test_event: UUID):
    """Test that creating an invitation with a nonexistent user fails."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(uuid4()),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 404
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_nonexistent_event(test_client: AsyncClient, test_user: UUID):
    """Test that creating an invitation with a nonexistent event fails."""
    invitation_data = {
        "event_id": str(uuid4()),
        "user_id": str(test_user),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 404
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_both_nonexistent(test_client: AsyncClient):
    """Test that creating an invitation with both nonexistent user and event fails."""
    invitation_data = {
        "event_id": str(uuid4()),
        "user_id": str(uuid4()),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 404
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_missing_event_id(test_client: AsyncClient, test_user: UUID):
    """Test that creating an invitation without event_id fails."""
    invitation_data = {
        "user_id": str(test_user),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_missing_user_id(test_client: AsyncClient, test_event: UUID):
    """Test that creating an invitation without user_id fails."""
    invitation_data = {
        "event_id": str(test_event),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_empty_body(test_client: AsyncClient):
    """Test that creating an invitation with empty body fails."""
    response = await test_client.post("/invitations", json={})
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_invalid_event_id_format(
    test_client: AsyncClient, test_user: UUID
):
    """Test that creating an invitation with invalid UUID format for event_id fails."""
    invitation_data = {
        "event_id": "not-a-valid-uuid",
        "user_id": str(test_user),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_invalid_user_id_format(
    test_client: AsyncClient, test_event: UUID
):
    """Test that creating an invitation with invalid UUID format for user_id fails."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": "not-a-valid-uuid",
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_invalid_expires_at_format(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test that creating an invitation with invalid expires_at format fails."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": "not-a-valid-datetime",
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_null_event_id(test_client: AsyncClient, test_user: UUID):
    """Test that creating an invitation with null event_id fails."""
    invitation_data: dict[str, str | None] = {
        "event_id": None,
        "user_id": str(test_user),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_null_user_id(test_client: AsyncClient, test_event: UUID):
    """Test that creating an invitation with null user_id fails."""
    invitation_data: dict[str, str | None] = {
        "event_id": str(test_event),
        "user_id": None,
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_wrong_data_types(test_client: AsyncClient):
    """Test that creating an invitation with wrong data types fails."""
    invitation_data = {
        "event_id": 12345,
        "user_id": 67890,
        "expires_at": 123456789,
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_invitation_empty_strings(test_client: AsyncClient):
    """Test that creating an invitation with empty string UUIDs fails."""
    invitation_data = {
        "event_id": "",
        "user_id": "",
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 422
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_create_duplicate_active_invitation(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test that creating a duplicate active invitation for the same user and event fails."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }

    response1 = await test_client.post("/invitations", json=invitation_data)
    assert response1.status_code == 201

    response2 = await test_client.post("/invitations", json=invitation_data)
    assert response2.status_code == 409
    data = response2.json()
    assert "detail" in data
    assert "already exists" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_invitation_invalid_token(test_client: AsyncClient):
    """Test getting invitation with invalid/non-existent token."""
    invalid_token = "invalid_token_12345"

    response = await test_client.get(f"/invitations/{invalid_token}")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_invitation_expired_by_date(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test that getting an invitation with past expiration date returns 410."""
    past_date = datetime.now(UTC) - timedelta(days=1)
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": past_date.isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    token = create_response.json()["token"]

    get_response = await test_client.get(f"/invitations/{token}")
    assert get_response.status_code == 410
    data = get_response.json()
    assert "detail" in data
    assert "expired" in data["detail"].lower()


@pytest.mark.asyncio
async def test_get_invitation_empty_token(test_client: AsyncClient):
    """Test getting invitation with empty token."""
    response = await test_client.get("/invitations/")
    assert response.status_code in [404, 405]


@pytest.mark.asyncio
async def test_get_invitation_malformed_token(test_client: AsyncClient):
    """Test getting invitation with malformed token (special characters)."""
    malformed_tokens = [
        "token'--DROP TABLE invitations;",
        "token/../../../etc/passwd",
        "tokenull",
        "token%20with%20spaces",
    ]

    for malformed_token in malformed_tokens:
        response = await test_client.get(f"/invitations/{malformed_token}")
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_invitations_invalid_filter_format(test_client: AsyncClient):
    """Test listing invitations with invalid filter format."""
    response = await test_client.get(
        "/invitations", params={"filter_expression": "invalid_filter"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_list_invitations_invalid_column_name(test_client: AsyncClient):
    """Test listing invitations with invalid column name in filter."""
    response = await test_client.get(
        "/invitations", params={"filter_expression": "nonexistent_column:eq:value"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_list_invitations_invalid_offset(test_client: AsyncClient):
    """Test listing invitations with negative offset."""
    response = await test_client.get("/invitations", params={"offset": -1})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_invitations_invalid_limit(test_client: AsyncClient):
    """Test listing invitations with invalid limit values."""
    # Limit too small
    response = await test_client.get("/invitations", params={"limit": 0})
    assert response.status_code == 422

    # Limit too large
    response = await test_client.get("/invitations", params={"limit": 2000})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_invitation_nonexistent_id(test_client: AsyncClient):
    """Test patching a non-existent invitation."""
    fake_uuid = "12345678-1234-4321-1234-123456789012"
    patch_data = {
        "patch": {fake_uuid: {"op": "replace", "path": "/status", "value": "Revoked"}}
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_invitation_invalid_field_path(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching with invalid field path."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    patch_data = {
        "patch": {
            invitation_id: {"op": "replace", "path": "/invalid_field", "value": "some_value"}
        }
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_invitation_immutable_field(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching immutable fields (event_id, user_id)."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    new_event_id = str(uuid4())
    patch_data = {
        "patch": {invitation_id: {"op": "replace", "path": "/event_id", "value": new_event_id}}
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 400

    new_user_id = str(uuid4())
    patch_data = {
        "patch": {invitation_id: {"op": "replace", "path": "/user_id", "value": new_user_id}}
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_invitation_invalid_status_value(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching with invalid status value."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    patch_data = {
        "patch": {
            invitation_id: {"op": "replace", "path": "/status", "value": "InvalidStatus"}
        }
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_invitation_invalid_expires_at_format(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching with invalid expires_at datetime format."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    patch_data = {
        "patch": {
            invitation_id: {
                "op": "replace",
                "path": "/expires_at",
                "value": "invalid-datetime",
            }
        }
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_invitation_unsupported_operation(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching with unsupported operation (not 'replace')."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    patch_data = {
        "patch": {invitation_id: {"op": "add", "path": "/status", "value": "Revoked"}}
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_patch_invitation_malformed_patch_data(test_client: AsyncClient):
    """Test patching with malformed patch data (missing required fields)."""
    patch_data = {
        "patch": {
            "some-id": {
                "path": "/status",
                "value": "Revoked",
            }
        }
    }

    response = await test_client.patch("/invitations", json=patch_data)
    assert response.status_code == 422
