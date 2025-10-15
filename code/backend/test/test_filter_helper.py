import pytest
from fastapi import HTTPException
from uuid import UUID

from app.service.filter_helper import parse_filter


def test_parse_filter_valid():
    """Test parsing a valid filter string."""
    filter_op = parse_filter("email:eq:test@example.com")
    assert filter_op.field == "email"
    assert filter_op.op == "="
    assert filter_op.value == "test@example.com"


def test_parse_filter_invalid_format():
    """Test parsing a filter string with invalid format."""
    with pytest.raises(HTTPException) as exc_info:
        parse_filter("email:test")
    assert exc_info.value.status_code == 400
    assert "Invalid filter format" in exc_info.value.detail


def test_parse_filter_invalid_operator():
    """Test parsing a filter with invalid operator."""
    with pytest.raises(HTTPException) as exc_info:
        parse_filter("email:invalid:test@example.com")
    assert exc_info.value.status_code == 400
    assert "Invalid operator" in exc_info.value.detail


def test_parse_filter_uuid_conversion():
    """Test parsing a filter with UUID value."""
    uuid_str = "123e4567-e89b-12d3-a456-426614174000"
    filter_op = parse_filter(f"user_id:eq:{uuid_str}")
    assert filter_op.field == "user_id"
    assert filter_op.op == "="
    assert isinstance(filter_op.value, UUID)
    assert str(filter_op.value) == uuid_str


def test_parse_filter_invalid_uuid():
    """Test parsing a filter with invalid UUID."""
    with pytest.raises(HTTPException) as exc_info:
        parse_filter("user_id:eq:invalid-uuid")
    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail


def test_parse_filter_general_error():
    """Test general error handling in filter parsing."""
    # Test with an empty string value which should raise a general error
    with pytest.raises(HTTPException) as exc_info:
        parse_filter("")
    assert exc_info.value.status_code == 400
    assert "Invalid filter format" in exc_info.value.detail