"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging

import app.db.categories as categories_db
from app.models.categories import PaginatedCategories
from app.service.exception_handler import handle_service_exceptions
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


@handle_service_exceptions
async def get_categories_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedCategories:
    filters = [parse_filter(f) for f in (filter_expression or [])]

    categories, total = await categories_db.get_categories_db(filters, offset, limit)
    return PaginatedCategories(items=categories, total=total, offset=offset, limit=limit)
