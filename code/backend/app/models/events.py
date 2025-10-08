from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EventBase(BaseModel):
    event_name: str = Field(..., max_length=100)
    event_datetime: datetime
    event_endtime: datetime
    event_location: str | None = Field(None, max_length=255)
    description: str | None = None
    picture_url: str | None = Field(None, max_length=255)
    capacity: int | None = None
    price_field: int | None = None
    user_id: UUID
    category_id: UUID


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    event_id: UUID
    created_at: datetime
    updated_at: datetime
