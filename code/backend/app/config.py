from pydantic_settings import BaseSettings


# TODO: Update DATABASE_URL: to work so that for local and testing it uses sqlite,
# and for production it uses postgres
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./events.db"


settings = Settings()
