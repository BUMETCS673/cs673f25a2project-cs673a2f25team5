from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class AttendeeStatus(str, Enum):
    """Enum for possible attendee statuses."""

    RSVPED = "RSVPed"
    MAYBE = "Maybe"
    NOT_GOING = "Not Going"


class AttendeeBase(BaseModel):
    event_id: UUID
    user_id: UUID
    status: AttendeeStatus | None = None


class AttendeeCreate(AttendeeBase):
    pass


class AttendeeRead(AttendeeBase):
    attendee_id: UUID
    created_at: datetime
    updated_at: datetime
