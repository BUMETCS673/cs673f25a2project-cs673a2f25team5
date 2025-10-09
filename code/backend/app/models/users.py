from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    first_name: str = Field(..., max_length=50, description="User's first name")
    last_name: str = Field(..., max_length=50, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    date_of_birth: date = Field(..., description="User's date of birth")
    color: str | None = Field(None, max_length=100, description="User's favorite color")

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v: str) -> str:
        """Validate and normalize name fields."""
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        """Validate that date of birth is in the past."""
        if v >= date.today():
            raise ValueError("Date of birth must be in the past")
        return v

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate and normalize color field if provided."""
        if v is None:
            return None
        normalized = v.strip()
        if not normalized:
            return None
        return normalized


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime
