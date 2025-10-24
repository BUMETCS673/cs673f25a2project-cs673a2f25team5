"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import logging
from typing import Annotated, Any

import jwt
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.config import settings

logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


class GoogleTokenPayload:
    """Represents the validated Google OAuth token payload."""

    def __init__(self, payload: dict[str, Any]) -> None:
        self.email: str = payload.get("email", "")
        self.email_verified: bool = payload.get("email_verified", False)
        self.name: str = payload.get("name", "")
        self.given_name: str = payload.get("given_name", "")
        self.family_name: str = payload.get("family_name", "")
        self.picture: str = payload.get("picture", "")
        self.sub: str = payload.get("sub", "")  # Google user ID
        self.iss: str = payload.get("iss", "")
        self.aud: str = payload.get("aud", "")


async def verify_google_token(token: str) -> GoogleTokenPayload:
    """
    Verify a Google OAuth token and return the user information.

    Args:
        token: The JWT token from Google OAuth

    Returns:
        GoogleTokenPayload: Validated token payload with user information

    Raises:
        HTTPException: If token is invalid or verification fails
    """
    try:
        # Get Google's public keys for token verification
        response = requests.get("https://www.googleapis.com/oauth2/v3/certs", timeout=5)
        response.raise_for_status()
        google_keys = response.json()

        # Decode the token header to get the key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid: str | None = unverified_header.get("kid")

        if not kid:
            logger.error("No 'kid' found in token header")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing key ID",
            )

        # Find the public key that matches the token's key ID
        public_key = None
        for key in google_keys["keys"]:
            if key["kid"] == kid:
                # Convert the JWK to PEM format for PyJWT
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not public_key:
            logger.error(f"Unable to find public key for kid: {kid}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: key not found",
            )

        # Verify and decode the token
        # PyJWT will validate signature, expiration, audience, and issuer
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            issuer="https://accounts.google.com",
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True,
                "verify_iss": True,
            },
        )

        # Verify email is verified
        email_verified: bool = bool(payload.get("email_verified", False))
        if not email_verified:
            email: str = str(payload.get("email", "unknown"))
            logger.warning(f"Unverified email attempted access: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified",
            )

        return GoogleTokenPayload(payload)

    except InvalidTokenError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from e
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Google public keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        ) from e


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> GoogleTokenPayload:
    """
    Dependency to extract and verify the current user from the Bearer token.

    This can be used in any endpoint that requires authentication:
    ```python
    @router.get("/protected")
    async def protected_route(user: Annotated[GoogleTokenPayload, Depends(get_current_user)]):
        return {"email": user.email}
    ```

    Args:
        credentials: The HTTP Bearer token credentials

    Returns:
        GoogleTokenPayload: The verified user information

    Raises:
        HTTPException: If authentication fails
    """
    # If OAuth is disabled (e.g., in development), skip authentication
    if not settings.GOOGLE_OAUTH_ENABLED:
        logger.warning("OAuth is disabled - returning mock user for development")
        return GoogleTokenPayload(
            {
                "email": "dev@example.com",
                "email_verified": True,
                "name": "Development User",
                "given_name": "Dev",
                "family_name": "User",
                "picture": "",
                "sub": "dev-user-id",
                "iss": "development",
                "aud": "development",
            }
        )

    if not credentials:
        logger.warning("No authorization credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await verify_google_token(credentials.credentials)


# Type alias for dependency injection
CurrentUser = Annotated[GoogleTokenPayload, Depends(get_current_user)]
