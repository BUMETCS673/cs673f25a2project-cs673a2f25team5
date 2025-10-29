"""
AI-generated code: 0%

Human code: 100%

Framework-generated code: 0%
"""


class DuplicateResourceError(Exception):
    """Exception raised when attempting to create a resource that already exists."""

    pass


class InvalidColumnError(Exception):
    """Exception raised when an invalid column is referenced in a query."""

    pass


class InvalidFilterFormatError(Exception):
    """Exception raised when a filter expression is malformed."""

    pass


class InvalidPathError(Exception):
    """Exception raised when a patch path is invalid."""

    pass


class NotFoundError(Exception):
    """Exception raised when a requested resource is not found."""

    pass


class UnsupportedPatchOperationError(Exception):
    """Exception raised when an unsupported patch operation is attempted."""

    pass


class ValidateFieldError(Exception):
    """Exception raised when a field fails validation."""

    pass
