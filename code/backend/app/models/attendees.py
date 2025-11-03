"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AttendeeStatus(str, Enum):
    """Enumeration for possible attendee statuses."""

    RSVPED = "RSVPed"
    MAYBE = "Maybe"
    NOT_GOING = "Not Going"


class AttendeeBase(BaseModel):
    """Shared attributes for Attendee create/read models."""

    event_id: UUID = Field(..., description="ID of the event being attended")
    user_id: UUID = Field(..., description="ID of the user attending the event")
    status: AttendeeStatus | None = Field(
        default=None, description="Attendance status (RSVPed/Maybe/Not Going)"
    )

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: AttendeeStatus | None) -> AttendeeStatus:
        """Return None if no status is provided, meaning the invite is pending."""
        return v


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

