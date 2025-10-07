from typing import Any

from fastapi import APIRouter

from app.db import db

router = APIRouter()


@router.get("/dbHealth", response_model=dict, summary="Database Health Check", tags=["Health"])
async def db_health_check() -> dict[str, Any]:
    """Check the health database connection."""
    db_health = await db.check_connection()
    return {"app": "healthy", "database": db_health}
