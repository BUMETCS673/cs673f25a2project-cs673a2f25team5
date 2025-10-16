from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Database settings with defaults that can be overridden by environment variables
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres1234"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "event_manager"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        # Look for .env file in the project root (two levels up from this file)
        env_file = Path(__file__).parent.parent.parent.parent / ".env"
        extra = "ignore"  # Ignore extra fields from .env file


settings = Settings()
