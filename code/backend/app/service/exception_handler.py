"""
AI-generated code: 95%

Human code: 5%

Framework-generated code: 0%
"""

import logging
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any, TypeVar

from fastapi import HTTPException
from pydantic import ValidationError

from app.models.exceptions import (
    DuplicateResourceError,
    InvalidColumnError,
    InvalidFilterFormatError,
    InvalidPathError,
    NotFoundError,
    UnsupportedPatchOperationError,
    ValidateFieldError,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")


def handle_service_exceptions(
    func: Callable[..., Awaitable[T]],
) -> Callable[..., Awaitable[T]]:
    """
    Decorator to centralize exception-to-HTTP mapping for service layer functions.

    This decorator catches custom exceptions and converts them to appropriate HTTPExceptions
    with consistent status codes and error messages. It also handles validation errors and
    unexpected exceptions.

    Exception Mapping:
    - InvalidFilterFormatError, InvalidColumnError -> 400 Bad Request
    - UnsupportedPatchOperationError, InvalidPathError -> 400 Bad Request
    - NotFoundError -> 404 Not Found
    - DuplicateResourceError -> 409 Conflict
    - ValidateFieldError, ValidationError -> 422 Unprocessable Entity
    - ValueError -> 500 Internal Server Error (database errors)
    - Exception -> 500 Internal Server Error (unexpected errors)
    - HTTPException -> re-raised as-is

    Usage:
        @handle_service_exceptions
        async def my_service_function(...):
            # Service logic that may raise custom exceptions
            pass
    """

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> T:
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # Re-raise HTTPExceptions that are already properly formatted
            raise
        except InvalidFilterFormatError as e:
            logger.error(f"Invalid filter_expression format in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e)) from e
        except InvalidColumnError as e:
            logger.error(f"Invalid column name in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e)) from e
        except UnsupportedPatchOperationError as e:
            logger.error(f"Unsupported patch operation in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e)) from e
        except InvalidPathError as e:
            logger.error(f"Invalid path in patch operation in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e)) from e
        except NotFoundError as e:
            logger.error(f"Resource not found in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=404, detail=str(e)) from e
        except DuplicateResourceError as e:
            logger.error(f"Duplicate resource error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=409, detail=str(e)) from e
        except ValidateFieldError as e:
            logger.error(f"Field validation error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=422, detail=str(e)) from e
        except ValidationError as e:
            logger.error(f"Validation error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=422, detail=str(e)) from e
        except ValueError as e:
            # Database errors from the db layer
            logger.error(f"Database error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error") from e
        except Exception as e:
            # Unexpected errors
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error") from e

    return wrapper
