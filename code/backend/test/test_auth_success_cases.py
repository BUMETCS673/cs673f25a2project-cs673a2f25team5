"""
AI-generated code: 95%

Human code: 5%

Framework-generated code: 0%
"""

import time
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import ClerkTokenPayload, get_current_user, verify_clerk_token


@pytest.fixture
def valid_clerk_payload() -> dict[str, Any]:
    return {
        "sub": "user_123456",
        "email": "test@example.com",
        "name": "Test User",
        "image_url": "https://example.com/image.jpg",
        "first_name": "Test",
        "last_name": "User",
        "iss": "https://clerk.example.com",
        "aud": "test-audience",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }


@pytest.fixture
def valid_clerk_payload_with_azp() -> dict[str, Any]:
    return {
        "sub": "user_123456",
        "email": "test@example.com",
        "name": "Test User",
        "first_name": "Test",
        "last_name": "User",
        "iss": "https://clerk.example.com",
        "azp": "test-audience",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }


@pytest.mark.asyncio
async def test_clerk_token_payload_initialization(valid_clerk_payload: dict[str, Any]):
    payload = ClerkTokenPayload(valid_clerk_payload)

    assert payload.sub == "user_123456"
    assert payload.email == "test@example.com"
    assert payload.name == "Test User"
    assert payload.image_url == "https://example.com/image.jpg"
    assert payload.first_name == "Test"
    assert payload.last_name == "User"
    assert payload.iss == "https://clerk.example.com"
    assert payload.aud == "test-audience"
    assert payload.exp == valid_clerk_payload["exp"]
    assert payload.iat == valid_clerk_payload["iat"]


@pytest.mark.asyncio
async def test_clerk_token_payload_with_azp(valid_clerk_payload_with_azp: dict[str, Any]):
    payload = ClerkTokenPayload(valid_clerk_payload_with_azp)

    assert payload.aud == "test-audience"
    assert payload.sub == "user_123456"


@pytest.mark.asyncio
async def test_clerk_token_payload_defaults():
    minimal_payload: dict[str, Any] = {}
    payload = ClerkTokenPayload(minimal_payload)

    assert payload.sub == ""
    assert payload.email == ""
    assert payload.name == ""
    assert payload.image_url == ""
    assert payload.first_name == ""
    assert payload.last_name == ""
    assert payload.iss == ""
    assert payload.aud == ""
    assert payload.exp == 0
    assert payload.iat == 0


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "test-audience")
async def test_verify_clerk_token_success(valid_clerk_payload: dict[str, Any]):
    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.return_value = valid_clerk_payload

        result = await verify_clerk_token("valid-token")

        assert isinstance(result, ClerkTokenPayload)
        assert result.sub == "user_123456"
        assert result.email == "test@example.com"
        mock_jwk_client.assert_called_once_with(
            "https://clerk.example.com/.well-known/jwks.json"
        )
        mock_jwt_decode.assert_called_once()


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "test-audience")
async def test_verify_clerk_token_with_audience_list(valid_clerk_payload: dict[str, Any]):
    payload_with_list_aud: dict[str, Any | list[str]] = valid_clerk_payload.copy()
    payload_with_list_aud["aud"] = ["test-audience", "another-audience"]

    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.return_value = payload_with_list_aud

        result = await verify_clerk_token("valid-token")

        assert isinstance(result, ClerkTokenPayload)
        assert result.sub == "user_123456"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_AUTH_ENABLED", False)
async def test_get_current_user_dev_mode():
    result = await get_current_user(credentials=None)

    assert isinstance(result, ClerkTokenPayload)
    assert result.sub == "dev-user-id"
    assert result.email == "dev@example.com"
    assert result.name == "Development User"
    assert result.first_name == "Dev"
    assert result.last_name == "User"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_AUTH_ENABLED", True)
@patch("app.auth.verify_clerk_token")
async def test_get_current_user_with_valid_token(
    mock_verify: MagicMock, valid_clerk_payload: dict[str, Any]
):
    mock_verify.return_value = ClerkTokenPayload(valid_clerk_payload)
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid-token")

    result = await get_current_user(credentials=credentials)

    assert isinstance(result, ClerkTokenPayload)
    assert result.email == "test@example.com"
    mock_verify.assert_called_once_with("valid-token")
