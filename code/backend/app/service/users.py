"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging
from uuid import UUID

from fastapi import HTTPException
from pydantic import ValidationError

import app.db.users as users_db
from app.db.filters import FilterOperation
from app.models.exceptions import (
    DuplicateResourceError,
    InvalidColumnError,
    InvalidFilterFormatError,
    InvalidPathError,
    NotFoundError,
    UnsupportedPatchOperationError,
    ValidateFieldError,
)
from app.models.patch import PatchRequest
from app.models.users import PaginatedUsers, UserBase, UserCreate, UserRead
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def get_users_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedUsers:
    try:
        filters = [parse_filter(f) for f in (filter_expression or [])]

        users, total = await users_db.get_users_db(filters, offset, limit)
        return PaginatedUsers(items=users, total=total, offset=offset, limit=limit)

    except InvalidFilterFormatError as e:
        logger.error(f"Invalid filter_expression format: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except InvalidColumnError as e:
        logger.error(f"Invalid column name in filter_expression: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        # Database errors
        logger.error(f"Database error while retrieving users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while retrieving users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def create_user_service(user: UserCreate) -> UserRead:
    try:
        await UserBase.validate_email_uniqueness(user.email)

        sanitized_user = UserCreate(
            first_name=user.first_name.strip(),
            last_name=user.last_name.strip(),
            email=user.email.strip().lower(),
            date_of_birth=user.date_of_birth,
            color=user.color.strip().lower() if user.color and user.color.strip() else None,
        )

        return await users_db.create_user_db(sanitized_user)

    except HTTPException:
        raise
    except DuplicateResourceError as e:
        logger.error(f"Duplicate resource error while creating user: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except ValueError as e:
        # Database errors from the db layer
        logger.error(f"Database error while creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def delete_user_service(user_id: UUID) -> UserRead:
    try:
        delete_user, _ = await users_db.get_users_db(
            [FilterOperation("user_id", "eq", user_id)], limit=1
        )
        if not delete_user:
            logger.warning(f"Attempted to delete non-existent user with ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        await users_db.delete_user_db(user_id)
        return delete_user[0]

    except HTTPException:
        raise
    except NotFoundError as e:
        logger.error(f"User not found during deletion: {str(e)}")
        raise HTTPException(status_code=404, detail="User not found") from e
    except ValueError as e:
        # Database errors from the db layer
        logger.error(f"Database error while deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def patch_users_service(request: PatchRequest) -> dict[UUID, UserRead]:
    try:
        updates = await UserBase.validate_patch_operations(request.patch)

        result = await users_db.batch_update_users_db(updates)

        logger.info(f"Successfully updated {len(result)} users in batch operation")
        return result

    except HTTPException:
        raise
    except UnsupportedPatchOperationError as e:
        logger.error(f"Unsupported patch operation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except DuplicateResourceError as e:
        logger.error(f"Duplicate resource error during batch update: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except InvalidPathError as e:
        logger.error(f"Invalid path in patch operation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except NotFoundError as e:
        logger.error(f"User not found during batch update: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValidateFieldError as e:
        logger.error(f"Field validation error during batch update: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e)) from e
    except ValidationError as e:
        logger.error(f"Validation error during batch update: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e)) from e
    except ValueError as e:
        # Database errors from the db layer
        logger.error(f"Database error during batch update: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to update users: Database error"
        ) from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error in patch_users_service: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
