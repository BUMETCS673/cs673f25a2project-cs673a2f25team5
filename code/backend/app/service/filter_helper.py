from uuid import UUID

from app.db.filters import FilterOperation
from app.models.exceptions import InvalidFilterFormatError

ID_FIELDS = {"user_id", "event_id", "category_id", "attendee_id"}


def parse_filter(filter_str: str) -> FilterOperation:
    """Parse a filter string in the format 'field:operator:value' into a FilterOperation."""
    parts = filter_str.split(":")
    if len(parts) != 3:
        raise InvalidFilterFormatError(
            "Invalid filter format. Expected format: field:operator:value"
        )

    field, op, value = parts

    # Convert value to appropriate type if needed (e.g., UUID for user_id)
    if field in ID_FIELDS:
        try:
            value = UUID(value)
        except ValueError as e:
            raise InvalidFilterFormatError(f"Invalid UUID format for {field}: {value}") from e

    return FilterOperation(field=field, op=op, value=value)
