from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    name: str = Field(..., max_length=100)
    date: datetime
    time: time
    location: str = Field(..., max_length=255)
    description: str = Field(..., max_length=1024)


class EventRead(BaseModel):
    id: UUID
    title: str
    name: str = Field(..., max_length=100)
    date: datetime
    time: time
    location: str = Field(..., max_length=255)
    description: str = Field(..., max_length=1024)
    user_id: UUID
