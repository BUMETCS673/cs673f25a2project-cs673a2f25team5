"""
AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%
"""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class JSONPatchOperation(BaseModel):
    op: str = Field(..., description="The operation to be performed")
    path: str = Field(..., description="The path to the target element")
    value: Any | None = Field(None, description="The value to be applied")


class PatchRequest(BaseModel):
    patch: dict[UUID, JSONPatchOperation] = Field(
        ..., description="A dictionary of patch operations"
    )
