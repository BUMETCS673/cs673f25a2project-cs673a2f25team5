from typing import Any

from fastapi import HTTPException

FILTER_OPERATORS = {
    "eq": "=",  # Exact match
    "neq": "!=",  # Not equal
    "gt": ">",  # Greater than
    "gte": ">=",  # Greater than or equal
    "lt": "<",  # Less than
    "lte": "<=",  # Less than or equal
    "like": "LIKE",  # Pattern matching
    "ilike": "ILIKE",  # Case-insensitive pattern matching
}


class FilterOperation:
    """Represents a filter operation with field, operator, and value."""

    def __init__(self, field: str, op: str, value: Any):
        if op not in FILTER_OPERATORS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid operator: {op}. "
                    f"Valid operators are: {', '.join(sorted(FILTER_OPERATORS))}"
                ),
            )
        self.field = field
        self.op = FILTER_OPERATORS[op]
        self.value = value


# Type for filter parameters
FilterParams = list[FilterOperation]
