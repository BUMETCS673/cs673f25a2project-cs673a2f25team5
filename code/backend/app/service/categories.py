"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging

from fastapi import HTTPException

import app.db.categories as categories_db
from app.models.categories import PaginatedCategories
from app.models.exceptions import InvalidColumnError, InvalidFilterFormatError
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def get_categories_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedCategories:
    try:
        filters = [parse_filter(f) for f in (filter_expression or [])]

        categories, total = await categories_db.get_categories_db(filters, offset, limit)
        return PaginatedCategories(items=categories, total=total, offset=offset, limit=limit)

    except InvalidFilterFormatError as e:
        logger.error(f"Invalid filter_expression format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid filter_expression format") from e
    except InvalidColumnError as e:
        logger.error(f"Invalid column name in filter_expression: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid column name") from e
    except ValueError as e:
        # Database errors
        logger.error(f"Database error while retrieving categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while retrieving categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
