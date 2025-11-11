"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import categories as categories_db
from app.db import db
from app.db.categories import metadata as categories_metadata
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
    db.metadata = categories_metadata
    categories_db.engine = engine

    yield engine

    # Restore original engine and metadata
    db.engine = original_engine
    db.metadata = original_metadata
    categories_db.engine = original_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Reset the database before each test."""
    async with test_engine.begin() as conn:
        # Drop and create all tables
        await conn.run_sync(categories_metadata.drop_all)
        await conn.run_sync(categories_metadata.create_all)
    yield


@pytest_asyncio.fixture
async def test_client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with an SQLite database."""
    transport = ASGITransport(app=event_manager_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def test_category() -> UUID:
    """Create a test category and return the category_id."""
    category_id = await categories_db.create_category_db(
        category_name="Test Category", description="A test category for events"
    )
    return category_id


@pytest.mark.asyncio
async def test_list_categories_empty(test_client: AsyncClient):
    """Test listing categories when database is empty."""
    response = await test_client.get("/categories")
    assert response.status_code == 200

    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["offset"] == 0
    assert data["limit"] == 100


@pytest.mark.asyncio
async def test_list_categories_with_data(test_client: AsyncClient):
    """Test listing categories with data in the database."""
    # Create multiple categories
    await categories_db.create_category_db(
        category_name="Sports", description="Sports and fitness events"
    )
    await categories_db.create_category_db(
        category_name="Music", description="Music and concert events"
    )
    await categories_db.create_category_db(
        category_name="Technology", description="Tech meetups and conferences"
    )

    response = await test_client.get("/categories")
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 3
    assert data["offset"] == 0
    assert data["limit"] == 100

    # Verify category names are present
    category_names = [item["category_name"] for item in data["items"]]
    assert "Sports" in category_names
    assert "Music" in category_names
    assert "Technology" in category_names


@pytest.mark.asyncio
async def test_list_categories_with_filter_eq(test_client: AsyncClient):
    """Test listing categories with equality filter."""
    await categories_db.create_category_db(
        category_name="Sports", description="Sports and fitness events"
    )
    await categories_db.create_category_db(
        category_name="Music", description="Music and concert events"
    )

    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:eq:Sports"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["category_name"] == "Sports"
    assert data["items"][0]["description"] == "Sports and fitness events"
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_categories_with_filter_ilike(test_client: AsyncClient):
    """Test listing categories with case-insensitive LIKE filter."""
    await categories_db.create_category_db(
        category_name="Sports", description="Sports and fitness events"
    )
    await categories_db.create_category_db(
        category_name="Music", description="Music and concert events"
    )
    await categories_db.create_category_db(
        category_name="Musical Theater", description="Theater and musical performances"
    )

    # Search for categories starting with "music" (case-insensitive)
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:ilike:music%"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 2

    category_names = [item["category_name"] for item in data["items"]]
    assert "Music" in category_names
    assert "Musical Theater" in category_names


@pytest.mark.asyncio
async def test_list_categories_with_filter_like(test_client: AsyncClient):
    """Test listing categories with case-sensitive LIKE filter."""
    await categories_db.create_category_db(
        category_name="Sports", description="Sports and fitness events"
    )
    await categories_db.create_category_db(
        category_name="Music", description="Music and concert events"
    )
    await categories_db.create_category_db(
        category_name="Theater", description="Theater performances"
    )

    # Search for categories containing "music" (case-sensitive)
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:like:%music%"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["category_name"] == "Music"


@pytest.mark.asyncio
async def test_list_categories_pagination(test_client: AsyncClient):
    """Test pagination of categories list."""
    # Create 5 categories
    for i in range(5):
        await categories_db.create_category_db(
            category_name=f"Category {i}", description=f"Description {i}"
        )

    # Get first page (2 items)
    response = await test_client.get("/categories", params={"offset": 0, "limit": 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["offset"] == 0
    assert data["limit"] == 2

    # Get second page (2 items)
    response = await test_client.get("/categories", params={"offset": 2, "limit": 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["offset"] == 2
    assert data["limit"] == 2

    # Get third page (1 item remaining)
    response = await test_client.get("/categories", params={"offset": 4, "limit": 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["total"] == 5
    assert data["offset"] == 4
    assert data["limit"] == 2


@pytest.mark.asyncio
async def test_list_categories_multiple_filters(test_client: AsyncClient):
    """Test listing categories with multiple filters."""
    await categories_db.create_category_db(
        category_name="Sports", description="Sports and fitness events"
    )
    await categories_db.create_category_db(
        category_name="Music", description="Music and concert events"
    )
    await categories_db.create_category_db(
        category_name="Sports Equipment", description="Buy and sell sports gear"
    )

    # Filter by category name containing "Sports"
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:ilike:%sports%"}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 2

    category_names = [item["category_name"] for item in data["items"]]
    assert "Sports" in category_names
    assert "Sports Equipment" in category_names


@pytest.mark.asyncio
async def test_list_categories_offset_beyond_total(test_client: AsyncClient):
    """Test pagination when offset is beyond total count."""
    await categories_db.create_category_db(
        category_name="Category 1", description="Description 1"
    )

    response = await test_client.get("/categories", params={"offset": 10})
    assert response.status_code == 200

    data = response.json()
    assert len(data["items"]) == 0
    assert data["total"] == 1
    assert data["offset"] == 10
