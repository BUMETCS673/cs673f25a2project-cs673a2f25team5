from uuid import UUID

from fastapi import HTTPException

from app.db.filters import FilterOperation


def parse_filter(filter_str: str) -> FilterOperation:
    """Parse a filter string in the format 'field:operator:value' into a FilterOperation."""
    try:
        field, op, value = filter_str.split(":")

        # Convert value to appropriate type if needed (e.g., UUID for user_id)
        if field == "user_id":
            value = UUID(value)

        return FilterOperation(field=field, op=op, value=value)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid filter format: {filter_str}. Expected format: field:operator:value",
        )
