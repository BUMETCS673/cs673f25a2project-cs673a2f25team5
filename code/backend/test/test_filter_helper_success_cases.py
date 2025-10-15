from app.service.filter_helper import parse_filter


def test_parse_filter_valid():
    """Test parsing a valid filter string."""
    filter_op = parse_filter("email:eq:test@example.com")
    assert filter_op.field == "email"
    assert filter_op.op == "="
    assert filter_op.value == "test@example.com"
