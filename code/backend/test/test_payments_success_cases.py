"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import os
import tempfile
from collections.abc import AsyncGenerator, Generator
from decimal import Decimal
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db import db
from app.db import payments as payments_db
from app.db.payments import metadata as payments_metadata
from app.main import event_manager_app


@pytest.fixture(scope="session")
def test_db_file() -> Generator[str, None, None]:
    """
    Create a temporary SQLite database file for payments tests.

    NOTE:
    - We close the low-level file descriptor immediately.
    - We DO NOT delete the file in teardown to avoid WinError 32
      on Windows when SQLite still has the file open.
    """
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    # Close the OS-level FD; SQLAlchemy will open its own handles.
    os.close(db_fd)

    # Yield the URL for SQLAlchemy
    yield f"sqlite+aiosqlite:///{db_path}"

    # Intentionally NOT removing the file here to avoid PermissionError on Windows.
    # The OS will clean up %TEMP% eventually.


@pytest_asyncio.fixture(scope="session")
async def test_engine(test_db_file: str) -> AsyncGenerator[AsyncEngine, None]:
    """
    Create a test engine and point the global db + payments_db to it.

    Mirrors the pattern used in users / events / categories tests.
    """
    engine = create_async_engine(
        test_db_file,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Store original engine/metadata so we can restore after the test session
    original_engine = db.engine
    original_metadata = db.metadata

    # Point the app DB layer to the test engine/metadata
    db.engine = engine
    db.metadata = payments_metadata
    payments_db.engine = engine

    yield engine

    # Restore original engine/metadata
    db.engine = original_engine
    db.metadata = original_metadata
    payments_db.engine = original_engine


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(test_engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Reset the payments table before each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(payments_metadata.drop_all)
        await conn.run_sync(payments_metadata.create_all)
    yield


@pytest_asyncio.fixture
async def test_client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client bound to the FastAPI app."""
    transport = ASGITransport(app=event_manager_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


class DummySession:
    """Simple fake Stripe Session object."""

    def __init__(self, session_id: str, url: str):
        self.id = session_id
        self.url = url


@pytest.mark.asyncio
async def test_create_checkout_session_success(
    test_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    """
    Happy path:
    - POST /payments/checkout-session
    - Stripe session is created via a monkeypatched helper
    - A payments row is written with status=created and correct amount
    """

    # --- Arrange: monkeypatch the Stripe checkout creator so no real API call happens ---
    def fake_create_checkout_session(
        *,
        amount_cents: int,
        event_id: str,
        user_id: str,
        success_url: str,
        cancel_url: str,
        customer_email: str | None = None,
    ) -> DummySession:
        # We assert conversion roughly here too
        assert amount_cents == 2500  # 25.00 USD -> 2500 cents
        assert event_id
        assert user_id
        assert success_url
        assert cancel_url
        return DummySession(
            session_id="cs_test_123",
            url="https://example.com/fake-checkout",
        )

    # IMPORTANT:
    # The router imported create_checkout_session directly:
    #   from app.service.stripe_service import create_checkout_session
    # So we must patch it where the route sees it: app.routes.payments.create_checkout_session
    monkeypatch.setattr(
        "app.routes.payments.create_checkout_session",
        fake_create_checkout_session,
    )

    # --- Arrange: input payload (event_id and user_id can be any UUIDs here) ---
    event_id = str(uuid4())
    user_id = str(uuid4())
    body = {
        "event_id": event_id,
        "user_id": user_id,
        "amount_usd": "25.00",
        "email": "payer@example.com",
    }

    # --- Act: call the API ---
    response = await test_client.post("/payments/checkout-session", json=body)

    # --- Assert: HTTP response correctness ---
    assert response.status_code == 200
    data = response.json()
    assert "checkout_url" in data
    assert data["checkout_url"] == "https://example.com/fake-checkout"

    # --- Assert: DB row was created correctly ---
    items, total = await payments_db.get_payments_db(filters=None, offset=0, limit=10)
    assert total == 1
    payment = items[0]

    assert str(payment.event_id) == event_id
    assert str(payment.user_id) == user_id
    assert payment.amount_usd == Decimal("25.00")
    assert payment.currency == "usd"
    # status is an enum; compare value
    # For a freshly created checkout, we start in 'created' state.
    assert payment.status.value == "created"
    assert payment.stripe_checkout_session_id == "cs_test_123"


@pytest.mark.asyncio
async def test_create_checkout_session_negative_amount_422(test_client: AsyncClient):
    """
    Validation rule:
    - amount_usd must be > 0
    - Negative amount should trigger 422 from Pydantic validation.
    """
    body = {
        "event_id": str(uuid4()),
        "user_id": str(uuid4()),
        "amount_usd": "-5.00",
        "email": "badpayer@example.com",
    }

    response = await test_client.post("/payments/checkout-session", json=body)
    assert response.status_code == 422
