"""
AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%
"""

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.exceptions import NotFoundError


class CategoryRead(BaseModel):
    category_id: UUID = Field(..., description="Unique identifier for the category")
    category_name: str = Field(..., description="Name of the category")
    description: str | None = Field(None, description="Description of the category")

    @classmethod
    async def validate_category_exists(cls, category_id: UUID) -> None:
        """Business logic validation - check if category exists."""
        import app.db.categories as categories_db
        from app.db.filters import FilterOperation

        categories, _ = await categories_db.get_categories_db(
            [FilterOperation("category_id", "eq", category_id)], limit=1
        )
        if not categories:
            raise NotFoundError(f"Category {category_id} does not exist")


class PaginatedCategories(BaseModel):
    items: list[CategoryRead] = Field(
        ..., description="List of categories in the current page"
    )
    total: int = Field(..., description="Total number of categories")
    offset: int = Field(..., description="Offset for pagination")
    limit: int = Field(..., description="Limit for pagination")
