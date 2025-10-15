from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


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
            raise ValueError("Event name cannot be empty")
        return v.strip()

    @field_validator("capacity")
    @classmethod
    def validate_capacity(cls, v: int | None) -> int | None:
        """Validate that capacity is positive if provided."""
        if v is not None and v <= 0:
            raise ValueError("Capacity must be positive")
        return v

    @field_validator("price_field")
    @classmethod
    def validate_price(cls, v: int | None) -> int | None:
        """Validate that price is non-negative if provided."""
        if v is not None and v < 0:
            raise ValueError("Price cannot be negative")
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
        if self.event_endtime <= self.event_datetime:
            raise ValueError("Event end time must be after start time")
        return self


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    event_id: UUID
    created_at: datetime
    updated_at: datetime


class PaginatedEvents(BaseModel):
    items: list[EventRead]
    total: int
    offset: int
    limit: int
