"""
AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%
"""

from uuid import UUID

from pydantic import BaseModel


class CategoryRead(BaseModel):
    category_id: UUID
    category_name: str
    description: str | None = None


class PaginatedCategories(BaseModel):
    items: list[CategoryRead]
    total: int
    offset: int
    limit: int
