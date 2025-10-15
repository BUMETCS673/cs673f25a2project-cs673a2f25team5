from uuid import UUID

from fastapi import HTTPException

from app.db.filters import FilterOperation


def parse_filter(filter_str: str) -> FilterOperation:
    """Parse a filter string in the format 'field:operator:value' into a FilterOperation."""
    parts = filter_str.split(":")
    if len(parts) != 3:
        raise HTTPException(
            status_code=400,
            detail="Invalid filter format. Expected format: field:operator:value",
        )

    field, op, value = parts

    # Convert value to appropriate type if needed (e.g., UUID for user_id)
    if field == "user_id":
        try:
            value = UUID(value)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid UUID format for user_id: {value}",
            ) from e

    return FilterOperation(field=field, op=op, value=value)
