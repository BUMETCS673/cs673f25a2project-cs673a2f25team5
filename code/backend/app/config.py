"""
AI-generated code: 60%

Human code: 40%

Framework-generated code: 0%
"""

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support.

    Settings can be configured via environment variables or a .env file.
    Environment variables take precedence over .env file values.
    """

    # Database settings with sensible defaults
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL username")
    POSTGRES_PASSWORD: str = Field(default="postgres1234", description="PostgreSQL password")
    POSTGRES_HOST: str = Field(default="localhost", description="PostgreSQL host address")
    POSTGRES_PORT: int = Field(
        default=5432, ge=1, le=65535, description="PostgreSQL port number"
    )
    POSTGRES_DB: str = Field(
        default="event_manager", min_length=1, description="PostgreSQL database name"
    )

    # Clerk authentication settings
    CLERK_JWKS_URL: str = Field(
        default="",
        description="Clerk JWKS endpoint used to verify session tokens.",
    )
    CLERK_ISSUER: str = Field(
        default="",
        description="Expected Clerk issuer (iss) claim when validating tokens.",
    )
    CLERK_JWT_AUDIENCE: str = Field(
        default="",
        description="Expected Clerk audience (aud/azp) claim when validating tokens.",
    )
    CLERK_AUTH_ENABLED: bool = Field(
        default=False,
        description="Toggle Clerk authentication. Set True to enforce token validation.",
    )

    # Frontend settings
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Frontend base URL for building invitation links.",
    )

    @field_validator("POSTGRES_PASSWORD")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Ensure password is not empty in production."""
        if not v or len(v.strip()) == 0:
            raise ValueError("Database password cannot be empty")
        return v

    @field_validator("POSTGRES_DB")
    @classmethod
    def validate_db_name(cls, v: str) -> str:
        """Ensure database name is valid."""
        if not v or len(v.strip()) == 0:
            raise ValueError("Database name cannot be empty")
        # PostgreSQL database names cannot contain certain characters
        invalid_chars = [" ", "/", "\\", "\n", "\r", "\t"]
        if any(char in v for char in invalid_chars):
            raise ValueError(f"Database name contains invalid characters: {invalid_chars}")
        return v.strip()

    @property
    def DATABASE_URL(self) -> str:
        """Construct the database URL from individual components.

        Returns:
            str: PostgreSQL connection string for asyncpg
        """
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        # Look for .env file in the project root
        env_file=str(Path(__file__).parent.parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",  # Ignore extra fields from .env file
        validate_default=True,  # Validate default values
    )


settings = Settings()
