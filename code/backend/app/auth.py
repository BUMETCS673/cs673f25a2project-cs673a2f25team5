"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import logging
import time
from typing import Annotated, Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError

from app.config import settings

logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)

# Clerk JWKs cache
_clerk_jwks_cache: dict[str, Any] = {}
_clerk_jwks_cache_expiry: float = 0


class ClerkTokenPayload:
    """Represents the validated Clerk token payload."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self.sub: str = payload.get("sub", "")
        self.email: str = payload.get("email", "")
        self.name: str = payload.get("name", "")
        self.image_url: str = payload.get("image_url", "")
        self.first_name: str = payload.get("first_name", "")
        self.last_name: str = payload.get("last_name", "")
        self.iss: str = payload.get("iss", "")
        self.aud: str = payload.get("aud") or payload.get("azp", "")
        self.exp: int = payload.get("exp", 0)
        self.iat: int = payload.get("iat", 0)


async def get_clerk_public_keys() -> dict[str, Any]:
    """
    Fetch Clerk's public keys with caching.
    Clerk rotates its JWKs periodically, so we cache them for 1 hour.
    """
    global _clerk_jwks_cache, _clerk_jwks_cache_expiry
    current_time = time.time()

    if _clerk_jwks_cache and current_time < _clerk_jwks_cache_expiry:
        logger.debug("Using cached Clerk JWKs")
        return _clerk_jwks_cache

    logger.debug("Fetching fresh Clerk JWKs")

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        clerk_keys = response.json()

    # Cache for 1 hour
    _clerk_jwks_cache = clerk_keys
    _clerk_jwks_cache_expiry = current_time + 3600
    logger.info("Cached Clerk JWKs for 1 hour")

    return clerk_keys


async def verify_clerk_token(token: str) -> ClerkTokenPayload:
    """
    Verify a Clerk-issued JWT and return user info.
    """
    try:
        # Ensure public keys are available
        await get_clerk_public_keys()

        # Use Clerk's JWK client for signature verification
        jwk_client = PyJWKClient(settings.CLERK_JWKS_URL)
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={"verify_exp": True, "verify_aud": False, "verify_iss": True},
        )

        audience_claim = payload.get("aud") or payload.get("azp")
        expected_audience = settings.CLERK_JWT_AUDIENCE

        if not audience_claim:
            logger.error("Clerk token missing audience/azp claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience",
            )

        if expected_audience:
            if isinstance(audience_claim, (list, tuple)):
                audience_valid = expected_audience in audience_claim
            else:
                audience_valid = audience_claim == expected_audience

            if not audience_valid:
                logger.error(
                    "Clerk token audience mismatch",
                    extra={"expected": expected_audience, "received": audience_claim},
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token audience",
                )

        if "aud" not in payload and audience_claim:
            payload["aud"] = audience_claim

        return ClerkTokenPayload(payload)

    except jwt.ExpiredSignatureError as exc:
        logger.error("Clerk token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        ) from exc
    except InvalidTokenError as e:
        logger.error(f"Invalid Clerk token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from e
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch Clerk JWKs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from e
    except Exception as e:
        logger.error(f"Unexpected Clerk token verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        ) from e


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> ClerkTokenPayload:
    """
    Extract and verify the current user from the Clerk Bearer token.
    Use in any endpoint requiring authentication:
    ```python
    @router.get("/protected")
    async def protected_route(user: Annotated[ClerkTokenPayload, Depends(get_current_user)]):
        return {"email": user.email}
    ```
    """
    # Development mode mock user
    if not settings.CLERK_AUTH_ENABLED:
        logger.warning("Clerk auth disabled - returning mock user")
        return ClerkTokenPayload(
            {
                "sub": "dev-user-id",
                "email": "dev@example.com",
                "name": "Development User",
                "first_name": "Dev",
                "last_name": "User",
                "iss": "development",
                "aud": "development",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        )

    if not credentials:
        logger.warning("No authorization credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await verify_clerk_token(credentials.credentials)


# Type alias for dependency injection
CurrentUser = Annotated[ClerkTokenPayload, Depends(get_current_user)]
