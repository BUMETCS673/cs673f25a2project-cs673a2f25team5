"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

import logging
from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.exceptions import (
    DuplicateResourceError,
    InvalidPathError,
    NotFoundError,
    UnsupportedPatchOperationError,
    ValidateFieldError,
)

logger = logging.getLogger(__name__)


class UserBase(BaseModel):
    first_name: str = Field(..., max_length=50, description="User's first name")
    last_name: str = Field(..., max_length=50, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    date_of_birth: date = Field(..., description="User's date of birth")
    color: str | None = Field(None, max_length=100, description="User's favorite color")

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v: str) -> str:
        """Validate and normalize name fields."""
        if not v or not v.strip():
            raise ValidateFieldError("Name cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate and normalize email field."""
        if not v or not v.strip():
            raise ValidateFieldError("Email cannot be empty")
        return v.strip().lower()

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        """Validate that date of birth is in the past."""
        if v >= date.today():
            raise ValidateFieldError("Date of birth must be in the past")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate and normalize color field if provided."""
        if v is None:
            return None
        normalized = v.strip()
        if not normalized:
            return None
        return normalized

    @classmethod
    async def validate_email_uniqueness(cls, email: str, user_id: UUID | None = None) -> None:
        """Business logic validation - check email uniqueness."""
        import app.db.users as users_db
        from app.db.filters import FilterOperation

        existing_users, _ = await users_db.get_users_db(
            [FilterOperation("email", "eq", email)], limit=1
        )
        if user_id:
            existing_users = [user for user in existing_users if user.user_id != user_id]
        if existing_users:
            raise DuplicateResourceError(f"Email {email} is already in use by another user")

    @classmethod
    async def validate_patch_field(
        cls,
        field_name: str,
        field_value: Any,
        user_id: UUID,
        current_user_data: dict[str, Any],
    ) -> Any:
        if field_name not in cls.model_fields:
            logger.error(f"Invalid field path '{field_name}' for user {user_id}")
            raise InvalidPathError(
                f"Invalid path: /{field_name}. "
                f"Allowed fields: {', '.join(cls.model_fields.keys())}"
            )

        temp_data = current_user_data.copy()
        temp_data[field_name] = field_value

        validated_instance = cls(**temp_data)
        validated_field_value = getattr(validated_instance, field_name)

        if field_name == "email":
            await cls.validate_email_uniqueness(validated_field_value, user_id)

        return validated_field_value

    @classmethod
    async def validate_patch_operations(
        cls, patch_operations: dict[UUID, Any]
    ) -> dict[UUID, dict[str, Any]]:
        import app.db.users as users_db
        from app.db.filters import FilterOperation

        validated_updates: dict[UUID, dict[str, Any]] = {}

        for user_id, operation in patch_operations.items():
            if operation.op != "replace":
                logger.error(f"Unsupported operation '{operation.op}' for user {user_id}")
                raise UnsupportedPatchOperationError(
                    f"Invalid operation: {operation.op}. Only 'replace' operation is supported"
                )

            field_path = operation.path.lstrip("/")
            current_users, _ = await users_db.get_users_db(
                [FilterOperation("user_id", "eq", user_id)], limit=1
            )
            if not current_users:
                raise NotFoundError(f"User {user_id} not found")

            current_user = current_users[0]
            current_user_data: dict[str, Any] = {
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
                "email": current_user.email,
                "date_of_birth": current_user.date_of_birth,
                "color": current_user.color,
            }

            validated_field_value = await cls.validate_patch_field(
                field_path, operation.value, user_id, current_user_data
            )

            validated_updates[user_id] = {field_path: validated_field_value}

        return validated_updates


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class PaginatedUsers(BaseModel):
    items: list[UserRead]
    total: int
    offset: int
    limit: int
