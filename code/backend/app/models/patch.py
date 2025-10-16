"""
AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%
"""

from typing import Any
from uuid import UUID

from pydantic import BaseModel


class JSONPatchOperation(BaseModel):
    op: str
    path: str
    value: Any | None = None


class PatchRequest(BaseModel):
    patch: dict[UUID, JSONPatchOperation]
