from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: EmailStr
    date_of_birth: date
    color: str | None = Field(None, max_length=100)


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime
