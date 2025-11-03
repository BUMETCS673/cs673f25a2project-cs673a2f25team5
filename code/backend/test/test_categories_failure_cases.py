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
async def test_list_categories_invalid_filter_format(test_client: AsyncClient):
    """Test that invalid filter format returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "invalid_format"}
    )
    assert response.status_code == 400
    assert "filter_expression format" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_categories_invalid_filter_no_colon(test_client: AsyncClient):
    """Test that filter without colons returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name_eq_Sports"}
    )
    assert response.status_code == 400
    assert "filter_expression format" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_categories_invalid_filter_too_few_parts(test_client: AsyncClient):
    """Test that filter with too few parts returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:eq"}
    )
    assert response.status_code == 400
    assert "filter_expression format" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_categories_invalid_column(test_client: AsyncClient):
    """Test that invalid column name returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "invalid_column:eq:value"}
    )
    assert response.status_code == 400
    assert "column" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_categories_invalid_column_nonexistent(test_client: AsyncClient):
    """Test that non-existent column name returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "nonexistent_field:eq:value"}
    )
    assert response.status_code == 400
    assert "column" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_categories_invalid_operator(test_client: AsyncClient):
    """Test that invalid operator returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:invalid_op:value"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_categories_invalid_operator_typo(test_client: AsyncClient):
    """Test that operator with typo returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_name:eqq:value"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_categories_invalid_uuid_filter(test_client: AsyncClient):
    """Test that invalid UUID in filter returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_id:eq:not-a-uuid"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_categories_malformed_uuid_filter(test_client: AsyncClient):
    """Test that malformed UUID in filter returns 400."""
    response = await test_client.get(
        "/categories", params={"filter_expression": "category_id:eq:12345-67890"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_categories_negative_offset(test_client: AsyncClient):
    """Test that negative offset is rejected."""
    response = await test_client.get("/categories", params={"offset": -1})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_categories_negative_limit(test_client: AsyncClient):
    """Test that negative limit is rejected."""
    response = await test_client.get("/categories", params={"limit": -1})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_categories_limit_exceeds_maximum(test_client: AsyncClient):
    """Test that limit exceeding maximum is rejected."""
    response = await test_client.get("/categories", params={"limit": 1001})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_categories_invalid_offset_type(test_client: AsyncClient):
    """Test that non-integer offset is rejected."""
    response = await test_client.get("/categories", params={"offset": "abc"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_categories_invalid_limit_type(test_client: AsyncClient):
    """Test that non-integer limit is rejected."""
    response = await test_client.get("/categories", params={"limit": "xyz"})
    assert response.status_code == 422
    