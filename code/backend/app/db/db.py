from sqlalchemy import (
    MetaData,
)
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo="debug",
    pool_size=15,
    pool_timeout=30,
)
metadata = MetaData()


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)
