"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.events import EventBase
from app.models.exceptions import (
    InvalidPathError,
    NotFoundError,
    UnsupportedPatchOperationError,
)
from app.models.users import UserBase

logger = logging.getLogger(__name__)


class AttendeeStatus(str, Enum):
    RSVPED = "RSVPed"
    MAYBE = "Maybe"
    NOT_GOING = "Not Going"


class AttendeeBase(BaseModel):
    event_id: UUID = Field(..., description="ID of the event being attended")
    user_id: UUID = Field(..., description="ID of the user attending the event")
    status: AttendeeStatus | None = Field(
        default=None, description="Attendance status (RSVPed/Maybe/Not Going)"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: AttendeeStatus | None) -> AttendeeStatus | None:
        """Return None if no status is provided, meaning the invite is pending."""
        return v

    @classmethod
    async def validate_patch_field(
        cls,
        field_name: str,
        field_value: Any,
        attendee_id: UUID,
        current_attendee_data: dict[str, Any],
    ) -> Any:
        if field_name not in cls.model_fields:
            logger.error(f"Invalid field path '{field_name}' for attendee {attendee_id}")
            raise InvalidPathError(
                f"Invalid path: /{field_name}. "
                f"Allowed fields: {', '.join(cls.model_fields.keys())}"
            )

        temp_data = current_attendee_data.copy()
        temp_data[field_name] = field_value

        validated_instance = cls(**temp_data)
        validated_field_value = getattr(validated_instance, field_name)

        # Validate foreign key references
        if field_name == "user_id":
            await UserBase.validate_user_exists(validated_field_value)
        elif field_name == "event_id":
            await EventBase.validate_event_exists(validated_field_value)

        return validated_field_value

    @classmethod
    async def validate_patch_operations(
        cls, patch_operations: dict[UUID, Any]
    ) -> dict[UUID, dict[str, Any]]:
        import app.db.attendees as attendees_db
        from app.db.filters import FilterOperation

        validated_updates: dict[UUID, dict[str, Any]] = {}

        for attendee_id, operation in patch_operations.items():
            if operation.op != "replace":
                logger.error(
                    f"Unsupported operation '{operation.op}' for attendee {attendee_id}"
                )
                raise UnsupportedPatchOperationError(
                    f"Invalid operation: {operation.op}. Only 'replace' operation is supported"
                )

            field_path = operation.path.lstrip("/")
            current_attendees, _ = await attendees_db.get_attendees_db(
                [FilterOperation("attendee_id", "eq", attendee_id)], limit=1
            )
            if not current_attendees:
                raise NotFoundError(f"Attendee {attendee_id} not found")

            current_attendee = current_attendees[0]
            current_attendee_data: dict[str, Any] = {
                "event_id": current_attendee.event_id,
                "user_id": current_attendee.user_id,
                "status": current_attendee.status,
            }

            validated_field_value = await cls.validate_patch_field(
                field_path, operation.value, attendee_id, current_attendee_data
            )

            validated_updates[attendee_id] = {field_path: validated_field_value}

        return validated_updates


class AttendeeCreate(AttendeeBase):
    """Model for creating a new attendee."""

    pass


class AttendeeRead(AttendeeBase):
    """Model for reading attendee data."""

    attendee_id: UUID = Field(..., description="Unique ID for the attendee")
    created_at: datetime = Field(..., description="Timestamp of creation")
    updated_at: datetime = Field(..., description="Timestamp of last update")


class PaginatedAttendees(BaseModel):
    """Paginated response for attendee listings."""

    items: list[AttendeeRead]
    total: int
    offset: int
    limit: int
