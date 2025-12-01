"""
AI-generated code: 95%

Human code: 5%

Framework-generated code: 0%
"""

import time
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from jwt.exceptions import PyJWKClientError

from app.auth import get_current_user, verify_clerk_token


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_AUTH_ENABLED", True)
async def test_get_current_user_no_credentials():
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=None)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Not authenticated"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "")
async def test_verify_clerk_token_missing_audience():
    payload_no_aud: dict[str, Any] = {
        "sub": "user_123456",
        "email": "test@example.com",
        "iss": "https://clerk.example.com",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }

    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.return_value = payload_no_aud

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("invalid-token")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Authentication failed"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "expected-audience")
async def test_verify_clerk_token_audience_mismatch():
    payload_wrong_aud: dict[str, Any] = {
        "sub": "user_123456",
        "email": "test@example.com",
        "iss": "https://clerk.example.com",
        "aud": "wrong-audience",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }

    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.return_value = payload_wrong_aud

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("invalid-token")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Authentication failed"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "expected-audience")
async def test_verify_clerk_token_audience_list_mismatch():
    payload_wrong_aud_list: dict[str, Any] = {
        "sub": "user_123456",
        "email": "test@example.com",
        "iss": "https://clerk.example.com",
        "aud": ["wrong-audience-1", "wrong-audience-2"],
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }

    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.return_value = payload_wrong_aud_list

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("invalid-token")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Authentication failed"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "test-audience")
async def test_verify_clerk_token_expired():
    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.side_effect = ExpiredSignatureError("Token expired")

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("expired-token")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Token expired"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "test-audience")
async def test_verify_clerk_token_invalid():
    mock_signing_key = MagicMock()
    mock_signing_key.key = "test-key"

    with (
        patch("app.auth.PyJWKClient") as mock_jwk_client,
        patch("app.auth.jwt.decode") as mock_jwt_decode,
    ):
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_jwk_client.return_value = mock_client_instance
        mock_jwt_decode.side_effect = InvalidTokenError("Invalid token")

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("invalid-token")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid token"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "test-audience")
async def test_verify_clerk_token_jwks_fetch_error():
    with patch("app.auth.PyJWKClient") as mock_jwk_client:
        mock_client_instance = MagicMock()
        mock_client_instance.get_signing_key_from_jwt.side_effect = PyJWKClientError(
            "Failed to fetch JWKS"
        )
        mock_jwk_client.return_value = mock_client_instance

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("token")

        assert exc_info.value.status_code == 503
        assert exc_info.value.detail == "Authentication service unavailable"


@pytest.mark.asyncio
@patch("app.auth.settings.CLERK_JWKS_URL", "https://clerk.example.com/.well-known/jwks.json")
@patch("app.auth.settings.CLERK_ISSUER", "https://clerk.example.com")
@patch("app.auth.settings.CLERK_JWT_AUDIENCE", "test-audience")
async def test_verify_clerk_token_unexpected_error():
    with patch("app.auth.PyJWKClient") as mock_jwk_client:
        mock_jwk_client.side_effect = Exception("Unexpected error")

        with pytest.raises(HTTPException) as exc_info:
            await verify_clerk_token("token")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Authentication failed"
