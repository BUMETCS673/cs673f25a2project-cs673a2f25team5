"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

from fastapi import APIRouter, Query

from app.models import categories as models_categories
from app.service import categories as categories_service

router = APIRouter()


FILTER_QUERY = Query(
    None,
    description="Filter in the format field:operator:value. Can be used multiple times.",
    examples=["category_name:ilike:Party%", "user_id:eq:550e8400-e29b-41d4-a716-446655440000"],
)
OFFSET_QUERY = Query(0, ge=0, description="Number of records to skip")
LIMIT_QUERY = Query(100, ge=1, le=1000, description="Maximum number of categories to return")


@router.get(
    "/categories",
    response_model=models_categories.PaginatedCategories,
    summary="Get a paginated list of categories",
    description=(
        "Get categories with optional filters using the format `field:operator:value`. "
        "Multiple filters can be combined using multiple filter_expression parameters.\n\n"
        "Available operators: eq, neq, gt, gte, lt, lte, like, ilike\n\n"
        "Pagination is supported via offset and limit parameters.\n\n"
        "Examples:\n"
        "- `/categories?filter_expression=category_name:ilike:Party%`\n"
        "- `/categories?offset=20&limit=10` (get third page of 10 categories)"
    ),
    tags=["Categories"],
    responses={
        200: {"description": "Paginated list of categories"},
        400: {
            "description": "Invalid parameters",
            "content": {
                "application/json": {
                    "examples": {
                        "InvalidFilterFormat": {
                            "summary": "Invalid filter_expression format",
                            "value": {"detail": "Invalid filter_expression format"},
                        },
                        "InvalidColumnName": {
                            "summary": "Invalid column name",
                            "value": {"detail": "Invalid column name"},
                        },
                        "LimitNotPositive": {
                            "summary": "Limit must be a positive integer",
                            "value": {"detail": "Limit must be a positive integer"},
                        },
                        "OffsetNegative": {
                            "summary": "Offset must be non-negative",
                            "value": {"detail": "Offset must be non-negative"},
                        },
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def list_categories(
    filter_expression: list[str] | None = FILTER_QUERY,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
) -> models_categories.PaginatedCategories:
    return await categories_service.get_categories_service(filter_expression, offset, limit)
