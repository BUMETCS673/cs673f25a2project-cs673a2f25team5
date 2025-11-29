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
from app.db import payments as payments_db
from app.db.payments import metadata as payments_metadata
from app.main import event_manager_app
from app.service import stripe_service


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
    os.close(db_fd)
    yield f"sqlite+aiosqlite:///{db_path}"
    # We intentionally do NOT delete the file on teardown (see note above).


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


@pytest.mark.asyncio
async def test_webhook_invalid_signature_returns_400(
    test_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    If Stripe signature verification fails, we should respond 400.
    app.service.stripe_service.process_webhook_event raises
    HTTPException(400, "Invalid signature").
    """

    # 1) Create a fake "stripe.error" module with a SignatureVerificationError
    class DummyErrorModule:
        class SignatureVerificationError(Exception):
            pass

    # 2) Patch the stripe instance used inside app.service.stripe_service
    #    so that stripe.error.SignatureVerificationError exists there.
    monkeypatch.setattr(
        stripe_service.stripe,
        "error",
        DummyErrorModule,
        raising=False,
    )

    # 3) Fake Stripe Webhook.construct_event to raise our fake SignatureVerificationError
    def fake_construct_event(payload: bytes, sig_header: str | None, secret: str):
        raise DummyErrorModule.SignatureVerificationError("bad sig", sig_header)

    monkeypatch.setattr(
        "app.service.stripe_service.stripe.Webhook.construct_event",
        fake_construct_event,
    )

    # 4) Call the webhook endpoint
    resp = await test_client.post(
        "/payments/webhook",
        content=b"{}",
        headers={"stripe-signature": "t=123,v1=abc"},
    )

    # 5) Assert we got the expected 400 response
    assert resp.status_code == 400
    assert "invalid signature" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_invalid_payload_returns_400(
    test_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    If Stripe cannot parse the event payload, we treat it as an invalid payload (400).
    """

    # 1) Provide a dummy error module so stripe.error.SignatureVerificationError is resolvable
    class DummyErrorModule:
        class SignatureVerificationError(Exception):
            pass

    monkeypatch.setattr(
        stripe_service.stripe,
        "error",
        DummyErrorModule,
        raising=False,
    )

    # 2) Make construct_event raise a non-signature error (ValueError)
    def fake_construct_event(payload: bytes, sig_header: str | None, secret: str):
        raise ValueError("bad json")

    monkeypatch.setattr(
        "app.service.stripe_service.stripe.Webhook.construct_event",
        fake_construct_event,
    )

    # 3) Call webhook
    resp = await test_client.post(
        "/payments/webhook",
        content=b"not-json",
        headers={"stripe-signature": "t=123,v1=abc"},
    )

    # 4) Assert 400 Invalid payload
    assert resp.status_code == 400
    assert "invalid payload" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_webhook_payment_intent_failed_is_acknowledged(
    test_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    For payment_intent.payment_failed we don't yet update the DB,
    but we must still acknowledge the event (200 / {"received": True}).
    """

    def fake_construct_event(payload: bytes, sig_header: str | None, secret: str):
        return {
            "type": "payment_intent.payment_failed",
            "data": {"object": {"id": "pi_999"}},
        }

    monkeypatch.setattr(
        "app.service.stripe_service.stripe.Webhook.construct_event",
        fake_construct_event,
    )

    resp = await test_client.post(
        "/payments/webhook",
        content=b"{}",
        headers={"stripe-signature": "t=123,v1=abc"},
    )

    assert resp.status_code == 200
    assert resp.json() == {"received": True}


@pytest.mark.asyncio
async def test_create_checkout_session_invalid_request_400(
    test_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    If Stripe raises InvalidRequestError, endpoint should return 400.
    """

    # 1) Dummy error module to emulate stripe.error.InvalidRequestError
    class DummyErrorModule:
        class InvalidRequestError(Exception):
            def __init__(self, message, param=None):
                super().__init__(message)
                self.param = param

    # PATCH the stripe instance inside stripe_service
    import app.service.stripe_service as stripe_service

    monkeypatch.setattr(stripe_service.stripe, "error", DummyErrorModule, raising=False)

    # 2) Fake checkout session creator that raises dummy InvalidRequestError
    def fake_create_checkout_session(*args, **kwargs):
        raise DummyErrorModule.InvalidRequestError("Bad amount", param="amount")

    # Patch where the router imported it
    monkeypatch.setattr(
        "app.service.stripe_service.create_checkout_session",
        fake_create_checkout_session,
    )

    # 3) Make the request
    body = {
        "event_id": str(uuid4()),
        "user_id": str(uuid4()),
        "amount_usd": "10.00",
        "email": "payer@example.com",
    }

    resp = await test_client.post("/payments/checkout-session", json=body)

    # 4) Assert
    assert resp.status_code == 400
    assert "invalid stripe request" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_checkout_session_auth_error_500(
    test_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    If Stripe raises AuthenticationError (bad API key), endpoint should return 500.
    """

    # Dummy error module to emulate stripe.error.*
    class DummyErrorModule:
        class InvalidRequestError(Exception):
            def __init__(self, message, param=None):
                super().__init__(message)
                self.param = param

        class AuthenticationError(Exception):
            def __init__(self, message, *args, **kwargs):
                super().__init__(message)

        class StripeError(Exception):
            pass

    # Patch the stripe instance used in stripe_service so stripe.error exists
    import app.service.stripe_service as stripe_service

    monkeypatch.setattr(
        stripe_service.stripe,
        "error",
        DummyErrorModule,
        raising=False,
    )

    # Fake checkout session creator that raises our dummy AuthenticationError
    def fake_create_checkout_session(*args, **kwargs):
        raise DummyErrorModule.AuthenticationError("Bad key")

    # Patch where the router imported it:
    monkeypatch.setattr(
        "app.service.stripe_service.create_checkout_session",
        fake_create_checkout_session,
    )

    body = {
        "event_id": str(uuid4()),
        "user_id": str(uuid4()),
        "amount_usd": "10.00",
        "email": "payer@example.com",
    }

    resp = await test_client.post("/payments/checkout-session", json=body)
    assert resp.status_code == 500
    assert "stripe authentication failed" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_checkout_session_generic_stripe_error_400(
    test_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """
    Generic StripeError (network/limit/etc.) should map to 400 with 'Stripe error'.
    """

    # Dummy error module for all stripe.error.* exceptions
    class DummyErrorModule:
        class InvalidRequestError(Exception):
            pass

        class AuthenticationError(Exception):
            pass

        class StripeError(Exception):
            pass

    # Patch stripe.error used inside stripe_service
    import app.service.stripe_service as stripe_service

    monkeypatch.setattr(
        stripe_service.stripe,
        "error",
        DummyErrorModule,
        raising=False,
    )

    # Fake checkout session creator that raises generic StripeError
    def fake_create_checkout_session(*args, **kwargs):
        raise DummyErrorModule.StripeError("Something went wrong")

    # Patch where router imported it
    monkeypatch.setattr(
        "app.service.stripe_service.create_checkout_session",
        fake_create_checkout_session,
    )

    body = {
        "event_id": str(uuid4()),
        "user_id": str(uuid4()),
        "amount_usd": "10.00",
        "email": "payer@example.com",
    }

    resp = await test_client.post("/payments/checkout-session", json=body)

    assert resp.status_code == 400
    assert "stripe error" in resp.json()["detail"].lower()


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
