"""
AI-generated code: 95%

Human code: 5%

Framework-generated code: 0%
"""

from typing import Any

ERROR_400_INVALID_FILTER: dict[str, Any] = {
    "description": "Invalid parameters",
    "content": {
        "application/json": {
            "examples": {
                "InvalidFilterFormat": {
                    "summary": "Invalid filter_expression format",
                    "value": {"detail": "Invalid filter_expression format"},
                },
                "InvalidColumnName": {
                    "summary": "Invalid column name",
                    "value": {"detail": "Invalid column name"},
                },
                "LimitNotPositive": {
                    "summary": "Limit must be a positive integer",
                    "value": {"detail": "Limit must be a positive integer"},
                },
                "OffsetNegative": {
                    "summary": "Offset must be non-negative",
                    "value": {"detail": "Offset must be non-negative"},
                },
            }
        }
    },
}

ERROR_400_INVALID_INPUT: dict[str, Any] = {
    "description": "Invalid input data",
    "content": {"application/json": {"example": {"detail": "Invalid input data"}}},
}

ERROR_400_PATCH_OPERATION: dict[str, Any] = {
    "description": "Invalid patch operation or data",
    "content": {
        "application/json": {
            "examples": {
                "InvalidOperation": {
                    "summary": "Invalid JSON Patch operation",
                    "value": {"detail": "Invalid operation: unsupported_op"},
                },
                "InvalidPath": {
                    "summary": "Invalid field path",
                    "value": {"detail": "Invalid path: /invalid_field"},
                },
                "InvalidValue": {
                    "summary": "Invalid field value",
                    "value": {"detail": "Invalid value for field"},
                },
            }
        }
    },
}

ERROR_404_NOT_FOUND: dict[str, Any] = {
    "description": "Resource not found",
    "content": {"application/json": {"example": {"detail": "Resource not found"}}},
}

ERROR_409_CONFLICT: dict[str, Any] = {
    "description": "Resource conflict - duplicate or constraint violation",
    "content": {"application/json": {"example": {"detail": "Resource already exists"}}},
}

ERROR_410_GONE: dict[str, Any] = {
    "description": "Resource no longer available",
    "content": {"application/json": {"example": {"detail": "Resource has expired or been removed"}}},
}

ERROR_422_VALIDATION: dict[str, Any] = {
    "description": "Validation error",
    "content": {"application/json": {"example": {"detail": "Validation error"}}},
}

ERROR_500_INTERNAL: dict[str, Any] = {
    "description": "Internal server error",
    "content": {"application/json": {"example": {"detail": "Internal server error"}}},
}


# Composite response sets for common endpoint patterns

# List endpoints (GET with filters, offset, limit)
RESPONSES_LIST: dict[int | str, dict[str, Any]] = {
    200: {"description": "Paginated list of resources"},
    400: ERROR_400_INVALID_FILTER,
    500: ERROR_500_INTERNAL,
}

# Create endpoints (POST)
RESPONSES_CREATE: dict[int | str, dict[str, Any]] = {
    201: {"description": "Resource created successfully"},
    400: ERROR_400_INVALID_INPUT,
    404: ERROR_404_NOT_FOUND,
    409: ERROR_409_CONFLICT,
    422: ERROR_422_VALIDATION,
    500: ERROR_500_INTERNAL,
}

# Get by ID endpoints (GET /{id})
RESPONSES_GET_BY_ID: dict[int | str, dict[str, Any]] = {
    200: {"description": "Resource retrieved successfully"},
    404: ERROR_404_NOT_FOUND,
    410: ERROR_410_GONE,
    500: ERROR_500_INTERNAL,
}

# Delete endpoints (DELETE /{id})
RESPONSES_DELETE: dict[int | str, dict[str, Any]] = {
    200: {"description": "Resource deleted successfully"},
    404: ERROR_404_NOT_FOUND,
    500: ERROR_500_INTERNAL,
}

# Patch endpoints (PATCH with JSON Patch)
RESPONSES_PATCH: dict[int | str, dict[str, Any]] = {
    200: {"description": "Resources patched successfully"},
    400: ERROR_400_PATCH_OPERATION,
    404: ERROR_404_NOT_FOUND,
    409: ERROR_409_CONFLICT,
    422: ERROR_422_VALIDATION,
    500: ERROR_500_INTERNAL,
}
