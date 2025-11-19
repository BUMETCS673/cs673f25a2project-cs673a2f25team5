"""
AI-generated code: 40%

Human code: 60%

Framework-generated code: 0%
"""

import logging
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.events import EventRead
from app.models.exceptions import (
    InvalidPathError,
    NotFoundError,
    UnsupportedPatchOperationError,
    ValidateFieldError,
)
from app.models.users import UserRead

logger = logging.getLogger(__name__)


class InvitationStatus(str, Enum):
    """Enum for possible invitation statuses."""

    ACTIVE = "Active"
    EXPIRED = "Expired"
    REVOKED = "Revoked"


class InvitationsBase(BaseModel):
    event_id: UUID = Field(..., description="ID of the event")
    user_id: UUID = Field(..., description="ID of the user sending the invitation")
    expires_at: datetime | None = Field(
        default_factory=lambda: datetime.now(UTC) + timedelta(hours=24),
        description="Expiration datetime of the invitation",
    )

    @classmethod
    async def validate_invitation_exists(cls, invitation_id: UUID) -> None:
        """Business logic validation - check if invitation exists."""
        import app.db.invitations as invitations_db
        from app.db.filters import FilterOperation

        invitations, _ = await invitations_db.get_invitations_db(
            [FilterOperation("invitation_id", "eq", invitation_id)], limit=1
        )
        if not invitations:
            raise NotFoundError(f"Invitation {invitation_id} does not exist")

    @classmethod
    async def validate_patch_field(
        cls,
        field_name: str,
        field_value: Any,
        invitation_id: UUID,
    ) -> Any:
        """Validate a field for PATCH operations."""
        patchable_fields = ["status", "expires_at"]
        if field_name not in patchable_fields:
            logger.error(f"Invalid field path '{field_name}' for invitation {invitation_id}")
            raise InvalidPathError(
                f"Invalid path: /{field_name}. Allowed fields: {', '.join(patchable_fields)}"
            )

        if field_name == "status":
            try:
                InvitationStatus(field_value)
            except ValueError as e:
                valid_statuses = [s.value for s in InvitationStatus]
                raise ValidateFieldError(
                    f"Invalid status: {field_value}. "
                    f"Must be one of: {', '.join(valid_statuses)}"
                ) from e

        if field_name == "expires_at" and field_value is not None:
            if isinstance(field_value, str):
                try:
                    field_value = datetime.fromisoformat(field_value.replace("Z", "+00:00"))
                except (ValueError, AttributeError) as e:
                    raise ValidateFieldError(
                        f"Invalid datetime format for expires_at: {field_value}"
                    ) from e

            if not isinstance(field_value, datetime):
                raise ValidateFieldError("expires_at must be a datetime")

        return field_value

    @classmethod
    async def validate_patch_operations(
        cls, patch_operations: dict[UUID, Any]
    ) -> dict[UUID, dict[str, Any]]:
        """Validate all patch operations for invitations."""
        import app.db.invitations as invitations_db
        from app.db.filters import FilterOperation

        validated_updates: dict[UUID, dict[str, Any]] = {}

        for invitation_id, operation in patch_operations.items():
            if operation.op != "replace":
                logger.error(
                    f"Unsupported operation '{operation.op}' for invitation {invitation_id}"
                )
                raise UnsupportedPatchOperationError(
                    f"Invalid operation: {operation.op}. Only 'replace' operation is supported"
                )

            field_path = operation.path.lstrip("/")
            current_invitations, _ = await invitations_db.get_invitations_db(
                [FilterOperation("invitation_id", "eq", invitation_id)], limit=1
            )
            if not current_invitations:
                raise NotFoundError(f"Invitation {invitation_id} not found")

            validated_field_value = await cls.validate_patch_field(
                field_path,
                operation.value,
                invitation_id,
            )

            validated_updates[invitation_id] = {field_path: validated_field_value}

        return validated_updates


class InvitationsCreate(InvitationsBase):
    pass


class InvitationsReadDB(InvitationsBase):
    invitation_id: UUID = Field(..., description="Unique identifier for the invitation")
    status: str = Field(..., max_length=20, description="Invitation status")
    created_at: datetime = Field(..., description="Invitation creation timestamp")
    updated_at: datetime = Field(..., description="Invitation last update timestamp")


class InvitationsRead(InvitationsReadDB):
    token: str = Field(
        ..., max_length=50, description="Invitation token (only returned on creation)"
    )
    invitation_link: str = Field(..., max_length=255, description="Full invitation link")


class InvitationsDetailResponse(InvitationsReadDB):
    event: EventRead = Field(..., description="Full event details")
    user: UserRead = Field(..., description="Invitation sender/organizer details")


class PaginatedInvitations(BaseModel):
    items: list[InvitationsReadDB] = Field(
        ..., description="List of invitations in the current page"
    )
    total: int = Field(..., description="Total number of invitations")
    offset: int = Field(..., description="Offset for pagination")
    limit: int = Field(..., description="Limit for pagination")
