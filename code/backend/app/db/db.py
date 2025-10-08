from typing import Any

from sqlalchemy import (
    MetaData,
    text,
)
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo="debug",
    pool_size=15,
    pool_timeout=30,
)
metadata = MetaData()


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)


async def check_connection() -> dict[str, Any]:
    """Test database connection and return version info."""
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            version = result.scalar()
            return {"status": "healthy", "version": version}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
