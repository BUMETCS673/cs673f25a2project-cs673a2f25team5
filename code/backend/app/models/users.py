from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)
    dob: datetime

class UserRead(BaseModel):
    id: UUID
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: str = Field(..., max_length=100)
    dob: datetime
