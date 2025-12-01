"""
AI-generated code: 100%
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

import pytest  # noqa: E402

from app.auth import ClerkTokenPayload, get_current_user  # noqa: E402
from app.main import event_manager_app  # noqa: E402


@pytest.fixture(autouse=True, scope="session")
def override_auth_dependency():
    """Provide a static authenticated user for all test requests."""

    def _fake_user() -> ClerkTokenPayload:
        return ClerkTokenPayload(
            {
                "sub": "test-user-id",
                "email": "test@example.com",
                "name": "Test User",
                "first_name": "Test",
                "last_name": "User",
                "iss": "test",
                "aud": "test",
                "exp": 9999999999,
                "iat": 0,
            }
        )

    event_manager_app.dependency_overrides[get_current_user] = _fake_user
    yield
    event_manager_app.dependency_overrides.pop(get_current_user, None)
