from uuid import UUID

import pytest

from app.models.exceptions import InvalidFilterFormatError
from app.service.filter_helper import parse_filter


def test_parse_filter_invalid_format():
    """Test parsing a filter string with invalid format."""
    with pytest.raises(InvalidFilterFormatError) as exc_info:
        parse_filter("email:test")
    assert "Invalid filter format" in str(exc_info.value)


def test_parse_filter_invalid_operator():
    """Test parsing a filter with invalid operator."""
    with pytest.raises(InvalidFilterFormatError) as exc_info:
        parse_filter("email:invalid:test@example.com")
    assert "Invalid operator" in str(exc_info.value)


def test_parse_filter_uuid_conversion():
    """Test parsing a filter with UUID value."""
    uuid_str = "2db3d8ac-257c-4ff9-ad97-ba96bfbf9bc5"
    filter_op = parse_filter(f"user_id:eq:{uuid_str}")
    assert filter_op.field == "user_id"
    assert filter_op.op == "="
    assert isinstance(filter_op.value, UUID)
    assert str(filter_op.value) == uuid_str


def test_parse_filter_invalid_uuid():
    """Test parsing a filter with invalid UUID."""
    with pytest.raises(InvalidFilterFormatError) as exc_info:
        parse_filter("user_id:eq:invalid-uuid")
    assert "Invalid UUID format" in str(exc_info.value)


def test_parse_filter_general_error():
    """Test general error handling in filter parsing."""
    # Test with an empty string value which should raise a general error
    with pytest.raises(InvalidFilterFormatError) as exc_info:
        parse_filter("")
    assert "Invalid filter format" in str(exc_info.value)
