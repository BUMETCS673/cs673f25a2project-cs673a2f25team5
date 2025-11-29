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
from app.db import invitations as invitations_db
from app.db import users as users_db
from app.db.categories import metadata as categories_metadata
from app.db.events import metadata as events_metadata
from app.db.invitations import metadata as invitations_metadata
from app.db.users import metadata as users_metadata
from app.main import event_manager_app
from app.models.events import EventCreate
from app.models.invitations import InvitationsCreate
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


@pytest_asyncio.fixture
async def valid_invitation_data(test_user: UUID, test_event: UUID) -> InvitationsCreate:
    """Return valid invitation data for testing with real user and event IDs."""
    return InvitationsCreate(
        event_id=test_event,
        user_id=test_user,
        expires_at=datetime.now(UTC) + timedelta(hours=48),
    )


@pytest.mark.asyncio
async def test_create_invitation_success(
    test_client: AsyncClient, valid_invitation_data: InvitationsCreate
):
    """Test successful invitation creation."""
    response = await test_client.post(
        "/invitations", json=valid_invitation_data.model_dump(mode="json")
    )
    assert response.status_code == 201

    data = response.json()
    assert UUID(data["invitation_id"])
    assert data["event_id"] == str(valid_invitation_data.event_id)
    assert data["user_id"] == str(valid_invitation_data.user_id)
    assert data["status"] == "Active"
    assert "token" in data
    assert "token_hash" not in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_invitation_with_default_expiration(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test that invitation uses default expiration (24 hours) when not provided."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 201

    data = response.json()
    assert UUID(data["invitation_id"])
    assert "expires_at" in data

    expires_at_str = data["expires_at"]
    if "T" in expires_at_str:
        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00")).date()
    else:
        expires_at = datetime.fromisoformat(expires_at_str).date()

    expected_date = (datetime.now(UTC) + timedelta(hours=24)).date()

    assert expires_at == expected_date


@pytest.mark.asyncio
async def test_create_invitation_custom_expiration(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test creating invitation with custom expiration time."""
    custom_expiration = datetime.now(UTC) + timedelta(days=7)
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": custom_expiration.isoformat(),
    }

    response = await test_client.post("/invitations", json=invitation_data)
    assert response.status_code == 201

    data = response.json()
    assert UUID(data["invitation_id"])

    expires_at_str = data["expires_at"]
    if "T" in expires_at_str:
        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00")).date()
    else:
        expires_at = datetime.fromisoformat(expires_at_str).date()

    assert expires_at == custom_expiration.date()


@pytest.mark.asyncio
async def test_create_invitation_token_format(
    test_client: AsyncClient, valid_invitation_data: InvitationsCreate
):
    """Test that generated token has correct format and properties."""
    response = await test_client.post(
        "/invitations", json=valid_invitation_data.model_dump(mode="json")
    )
    assert response.status_code == 201

    data = response.json()

    token = data["token"]
    assert isinstance(token, str)
    assert len(token) > 0


@pytest.mark.asyncio
async def test_get_invitation_by_token_success(
    test_client: AsyncClient, valid_invitation_data: InvitationsCreate
):
    """Test successfully retrieving invitation details by token."""
    create_response = await test_client.post(
        "/invitations", json=valid_invitation_data.model_dump(mode="json")
    )
    assert create_response.status_code == 201
    create_data = create_response.json()
    token = create_data["token"]

    get_response = await test_client.get(f"/invitations/{token}")
    assert get_response.status_code == 200

    get_data = get_response.json()
    assert UUID(get_data["invitation_id"]) == UUID(create_data["invitation_id"])
    assert get_data["event_id"] == str(valid_invitation_data.event_id)
    assert get_data["user_id"] == str(valid_invitation_data.user_id)
    assert get_data["status"] == "Active"

    assert "event" in get_data
    assert "event_name" in get_data["event"]
    assert "event_datetime" in get_data["event"]

    assert "user" in get_data
    assert "first_name" in get_data["user"]
    assert "email" in get_data["user"]


@pytest.mark.asyncio
async def test_get_invitation_includes_event_details(
    test_client: AsyncClient, valid_invitation_data: InvitationsCreate
):
    """Test that invitation response includes full event details."""
    create_response = await test_client.post(
        "/invitations", json=valid_invitation_data.model_dump(mode="json")
    )
    token = create_response.json()["token"]

    response = await test_client.get(f"/invitations/{token}")
    assert response.status_code == 200

    data = response.json()
    event = data["event"]

    assert "event_id" in event
    assert "event_name" in event
    assert "event_datetime" in event
    assert "event_endtime" in event
    assert "event_location" in event
    assert "category_id" in event
    assert "user_id" in event


@pytest.mark.asyncio
async def test_get_invitation_includes_user_details(
    test_client: AsyncClient, valid_invitation_data: InvitationsCreate
):
    """Test that invitation response includes full user details."""
    create_response = await test_client.post(
        "/invitations", json=valid_invitation_data.model_dump(mode="json")
    )
    token = create_response.json()["token"]

    response = await test_client.get(f"/invitations/{token}")
    assert response.status_code == 200

    data = response.json()
    user = data["user"]

    assert "user_id" in user
    assert "first_name" in user
    assert "last_name" in user
    assert "email" in user
    assert "date_of_birth" in user
    assert "color" in user


@pytest.mark.asyncio
async def test_get_invitation_does_not_expose_sensitive_data(
    test_client: AsyncClient, valid_invitation_data: InvitationsCreate
):
    """Test that sensitive data (token, token_hash) is not exposed in GET response."""
    create_response = await test_client.post(
        "/invitations", json=valid_invitation_data.model_dump(mode="json")
    )
    token = create_response.json()["token"]

    response = await test_client.get(f"/invitations/{token}")
    assert response.status_code == 200

    data = response.json()

    assert "token" not in data
    assert "token_hash" not in data


@pytest.mark.asyncio
async def test_list_invitations_empty(test_client: AsyncClient):
    """Test listing invitations when database is empty."""
    response = await test_client.get("/invitations")
    assert response.status_code == 200

    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] == 100


@pytest.mark.asyncio
async def test_list_invitations_with_data(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test listing invitations with data in the database."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201

    response = await test_client.get("/invitations")
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_id"] == str(test_event)
    assert data["items"][0]["user_id"] == str(test_user)
    assert data["items"][0]["status"] == "Active"
    assert data["total"] == 1

    assert "token" not in data["items"][0]
    assert "token_hash" not in data["items"][0]


@pytest.mark.asyncio
async def test_list_invitations_with_filter_status(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test listing invitations filtered by status."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }

    await test_client.post("/invitations", json=invitation_data)

    response = await test_client.get(
        "/invitations", params={"filter_expression": "status:eq:Active"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "Active"
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_invitations_with_filter_event_id(
    test_client: AsyncClient, test_user: UUID, test_event: UUID, test_category: UUID
):
    """Test listing invitations filtered by event_id."""
    invitation1 = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }
    await test_client.post("/invitations", json=invitation1)

    now = datetime.now(UTC)
    event2 = EventCreate(
        event_name="Second Event",
        event_datetime=now + timedelta(days=3),
        event_endtime=now + timedelta(days=3, hours=2),
        event_location="Location 2",
        description="Second event description",
        picture_url="https://example.com/pic2.jpg",
        capacity=50,
        price_field=15,
        user_id=test_user,
        category_id=test_category,
    )
    event2_response = await test_client.post("/events", json=event2.model_dump(mode="json"))
    event2_id = event2_response.json()["event_id"]

    invitation2: dict[str, str] = {
        "event_id": event2_id,
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }
    await test_client.post("/invitations", json=invitation2)

    response = await test_client.get(
        "/invitations", params={"filter_expression": f"event_id:eq:{test_event}"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["event_id"] == str(test_event)
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_invitations_with_filter_user_id(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test listing invitations filtered by user_id."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }

    await test_client.post("/invitations", json=invitation_data)

    response = await test_client.get(
        "/invitations", params={"filter_expression": f"user_id:eq:{test_user}"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["user_id"] == str(test_user)
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_invitations_with_pagination(
    test_client: AsyncClient, test_user: UUID, test_event: UUID, test_category: UUID
):
    """Test listing invitations with pagination (offset and limit)."""
    now = datetime.now(UTC)

    for i in range(5):
        event = EventCreate(
            event_name=f"Event {i}",
            event_datetime=now + timedelta(days=i + 1),
            event_endtime=now + timedelta(days=i + 1, hours=2),
            event_location=f"Location {i}",
            description=f"Description {i}",
            picture_url=f"https://example.com/pic{i}.jpg",
            capacity=100,
            price_field=10,
            user_id=test_user,
            category_id=test_category,
        )
        event_response = await test_client.post("/events", json=event.model_dump(mode="json"))
        event_id = event_response.json()["event_id"]

        invitation_data: dict[str, str] = {
            "event_id": event_id,
            "user_id": str(test_user),
            "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
        }
        await test_client.post("/invitations", json=invitation_data)

    response = await test_client.get("/invitations", params={"offset": 0, "limit": 2})
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["offset"] == 0
    assert data["limit"] == 2

    response = await test_client.get("/invitations", params={"offset": 2, "limit": 2})
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["offset"] == 2
    assert data["limit"] == 2


@pytest.mark.asyncio
async def test_list_invitations_multiple_filters(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test listing invitations with multiple filters combined."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    }

    await test_client.post("/invitations", json=invitation_data)

    response = await test_client.get(
        "/invitations",
        params={
            "filter_expression": [
                "status:eq:Active",
                f"event_id:eq:{test_event}",
            ]
        },
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "Active"
    assert data["items"][0]["event_id"] == str(test_event)


@pytest.mark.asyncio
async def test_patch_invitation_status(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching invitation status to Revoked."""
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    patch_response = await test_client.patch(
        "/invitations",
        json={
            "patch": {
                invitation_id: {
                    "op": "replace",
                    "path": "/status",
                    "value": "Revoked",
                }
            }
        },
    )

    assert patch_response.status_code == 200
    response_json = patch_response.json()
    assert invitation_id in response_json
    assert response_json[invitation_id]["status"] == "Revoked"
    assert response_json[invitation_id]["invitation_id"] == invitation_id


@pytest.mark.asyncio
async def test_patch_invitation_expires_at(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """Test patching invitation expiration date."""
    original_expiration = datetime.now(UTC) + timedelta(days=7)
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": original_expiration.isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    new_expiration = datetime.now(UTC) + timedelta(days=14)
    patch_response = await test_client.patch(
        "/invitations",
        json={
            "patch": {
                invitation_id: {
                    "op": "replace",
                    "path": "/expires_at",
                    "value": new_expiration.isoformat(),
                }
            }
        },
    )

    assert patch_response.status_code == 200
    response_json = patch_response.json()
    assert invitation_id in response_json


@pytest.mark.asyncio
async def test_patch_multiple_invitations(
    test_client: AsyncClient, test_user: UUID, test_event: UUID, test_category: UUID
):
    """Test patching multiple invitations in one request."""
    invitation1_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create1_response = await test_client.post("/invitations", json=invitation1_data)
    assert create1_response.status_code == 201
    invitation1_id = create1_response.json()["invitation_id"]

    now = datetime.now(UTC)
    event2 = EventCreate(
        event_name="Second Event for Patch Test",
        event_datetime=now + timedelta(days=10),
        event_endtime=now + timedelta(days=10, hours=2),
        event_location="Second Location",
        description="Second event for patch test",
        picture_url="https://example.com/pic2.jpg",
        capacity=50,
        price_field=15,
        user_id=test_user,
        category_id=test_category,
    )
    event2_response = await test_client.post("/events", json=event2.model_dump(mode="json"))
    assert event2_response.status_code == 201
    event2_id = event2_response.json()["event_id"]

    invitation2_data: dict[str, str] = {
        "event_id": event2_id,
        "user_id": str(test_user),
        "expires_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
    }

    create2_response = await test_client.post("/invitations", json=invitation2_data)
    assert create2_response.status_code == 201
    invitation2_id = create2_response.json()["invitation_id"]

    patch_response = await test_client.patch(
        "/invitations",
        json={
            "patch": {
                invitation1_id: {
                    "op": "replace",
                    "path": "/status",
                    "value": "Revoked",
                },
                invitation2_id: {
                    "op": "replace",
                    "path": "/status",
                    "value": "Expired",
                },
            }
        },
    )

    assert patch_response.status_code == 200
    response_json = patch_response.json()
    assert len(response_json) == 2
    assert response_json[invitation1_id]["status"] == "Revoked"
    assert response_json[invitation2_id]["status"] == "Expired"


@pytest.mark.asyncio
async def test_auto_expire_invitation_on_list(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """
    Test that invitations are automatically expired when listed if expiration date has passed.
    """
    past_expiration = datetime.now(UTC) - timedelta(days=1)
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": past_expiration.isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    invitation_id = create_response.json()["invitation_id"]

    assert create_response.json()["status"] == "Active"

    list_response = await test_client.get("/invitations")
    assert list_response.status_code == 200

    data = list_response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["invitation_id"] == invitation_id
    assert data["items"][0]["status"] == "Expired"


@pytest.mark.asyncio
async def test_auto_expire_invitation_on_get_by_token(
    test_client: AsyncClient, test_user: UUID, test_event: UUID
):
    """
    Test that invitation is automatically expired when fetched by token
    if expiration date has passed.
    """
    past_expiration = datetime.now(UTC) - timedelta(days=1)
    invitation_data = {
        "event_id": str(test_event),
        "user_id": str(test_user),
        "expires_at": past_expiration.isoformat(),
    }

    create_response = await test_client.post("/invitations", json=invitation_data)
    assert create_response.status_code == 201
    token = create_response.json()["token"]

    assert create_response.json()["status"] == "Active"

    get_response = await test_client.get(f"/invitations/{token}")
    assert get_response.status_code == 410
    assert "expired" in get_response.json()["detail"].lower()

    list_response = await test_client.get("/invitations")
    assert list_response.status_code == 200
    data = list_response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "Expired"
