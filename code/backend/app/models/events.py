"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.categories import CategoryRead
from app.models.exceptions import (
    InvalidPathError,
    NotFoundError,
    UnsupportedPatchOperationError,
    ValidateFieldError,
)
from app.models.users import UserBase

logger = logging.getLogger(__name__)


class EventBase(BaseModel):
    event_name: str = Field(..., max_length=100, description="Name of the event")
    event_datetime: datetime = Field(..., description="Start date and time of the event")
    event_endtime: datetime = Field(..., description="End date and time of the event")
    event_location: str | None = Field(
        None, max_length=255, description="Location of the event"
    )
    description: str | None = Field(None, description="Description of the event")
    picture_url: str | None = Field(None, max_length=255, description="URL to event picture")
    capacity: int | None = Field(None, description="Maximum number of attendees (optional)")
    price_field: int | None = Field(None, description="Event price in cents (optional)")
    user_id: UUID = Field(..., description="ID of the event creator")
    category_id: UUID = Field(..., description="ID of the event category")

    @field_validator("event_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate and normalize event name."""
        if not v or not v.strip():
            raise ValidateFieldError("Event name cannot be empty")
        return v.strip()

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int | None) -> int | None:
        """Validate that capacity is positive if provided."""
        if v is not None and v <= 0:
            raise ValidateFieldError("Capacity must be positive")
        return v

    @field_validator("price_field")
    @classmethod
    def validate_price(cls, v: int | None) -> int | None:
        """Validate that price is non-negative if provided."""
        if v is not None and v < 0:
            raise ValidateFieldError("Price cannot be negative")
        return v

    @field_validator("event_location", "description")
    @classmethod
    def validate_optional_text(cls, v: str | None) -> str | None:
        """Validate and normalize optional text fields."""
        if v is None:
            return None
        normalized = v.strip()
        if not normalized:
            return None
        return normalized

    @model_validator(mode="after")
    def validate_event_times(self) -> Any:
        """Validate that end time is after start time."""
        # Handle timezone awareness differences
        start_time = self.event_datetime
        end_time = self.event_endtime

        # If one is timezone-aware and the other is not, make them compatible
        if start_time.tzinfo is not None and end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=UTC)
        elif start_time.tzinfo is None and end_time.tzinfo is not None:
            start_time = start_time.replace(tzinfo=UTC)

        if end_time <= start_time:
            raise ValidateFieldError("Event end time must be after start time")
        return self

    @classmethod
    async def validate_event_exists(cls, event_id: UUID) -> None:
        """Business logic validation - check if event exists."""
        import app.db.events as events_db
        from app.db.filters import FilterOperation

        events, _ = await events_db.get_events_db(
            [FilterOperation("event_id", "eq", event_id)], limit=1
        )
        if not events:
            raise NotFoundError(f"Event {event_id} does not exist")

    @classmethod
    async def validate_patch_field(
        cls,
        field_name: str,
        field_value: Any,
        event_id: UUID,
        current_event_data: dict[str, Any],
    ) -> Any:
        if field_name not in cls.model_fields:
            logger.error(f"Invalid field path '{field_name}' for event {event_id}")
            raise InvalidPathError(
                f"Invalid path: /{field_name}. "
                f"Allowed fields: {', '.join(cls.model_fields.keys())}"
            )

        temp_data = current_event_data.copy()
        temp_data[field_name] = field_value

        validated_instance = cls(**temp_data)
        validated_field_value = getattr(validated_instance, field_name)

        if field_name == "user_id":
            await UserBase.validate_user_exists(validated_field_value)
        elif field_name == "category_id":
            await CategoryRead.validate_category_exists(validated_field_value)

        return validated_field_value

    @classmethod
    async def validate_patch_operations(
        cls, patch_operations: dict[UUID, Any]
    ) -> dict[UUID, dict[str, Any]]:
        import app.db.events as events_db
        from app.db.filters import FilterOperation

        validated_updates: dict[UUID, dict[str, Any]] = {}

        for event_id, operation in patch_operations.items():
            if operation.op != "replace":
                logger.error(f"Unsupported operation '{operation.op}' for event {event_id}")
                raise UnsupportedPatchOperationError(
                    f"Invalid operation: {operation.op}. Only 'replace' operation is supported"
                )

            field_path = operation.path.lstrip("/")
            current_events, _ = await events_db.get_events_db(
                [FilterOperation("event_id", "eq", event_id)], limit=1
            )
            if not current_events:
                raise NotFoundError(f"Event {event_id} not found")

            current_event = current_events[0]
            current_event_data: dict[str, Any] = {
                "event_name": current_event.event_name,
                "event_datetime": current_event.event_datetime,
                "event_endtime": current_event.event_endtime,
                "event_location": current_event.event_location,
                "description": current_event.description,
                "picture_url": current_event.picture_url,
                "capacity": current_event.capacity,
                "price_field": current_event.price_field,
                "user_id": current_event.user_id,
                "category_id": current_event.category_id,
            }

            validated_field_value = await cls.validate_patch_field(
                field_path, operation.value, event_id, current_event_data
            )

            validated_updates[event_id] = {field_path: validated_field_value}

        return validated_updates


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    event_id: UUID = Field(..., description="Unique identifier for the event")
    created_at: datetime = Field(..., description="Event creation timestamp")
    updated_at: datetime = Field(..., description="Event last update timestamp")


class PaginatedEvents(BaseModel):
    items: list[EventRead] = Field(..., description="List of events in the current page")
    total: int = Field(..., description="Total number of events")
    offset: int = Field(..., description="Offset for pagination")
    limit: int = Field(..., description="Limit for pagination")
