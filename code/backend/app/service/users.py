import logging
from uuid import UUID

from fastapi import HTTPException

import app.db.users as users_db
from app.db.filters import FilterOperation
from app.models.users import PaginatedUsers, UserCreate, UserRead
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def get_users_service(
    filter: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedUsers:
    """
    Retrieve users with optional filters, offset, and limit.

    Validates:
    - Limit is a positive integer
    - Offset is non-negative
    - Filters are well-formed
    """
    filters = [parse_filter(f) for f in (filter or [])]
    if filters:
        for f in filters:
            column = getattr(users_db.users.c, f.field, None)
            if column is None:
                logger.error(f"Invalid filter field: {f.field}")
                raise HTTPException(status_code=400, detail=f"Invalid column name: {f.field}")
    if limit < 0:
        logger.error(f"Limit must be non-negative: {limit}")
        raise HTTPException(status_code=400, detail="Limit must be a non-negative integer")
    if offset < 0:
        logger.error(f"Offset must be non-negative: {offset}")
        raise HTTPException(status_code=400, detail="Offset must be non-negative")

    try:
        users, total = await users_db.get_users_db(filters, offset, limit)
        return PaginatedUsers(items=users, total=total, offset=offset, limit=limit)
    except HTTPException:
        # Let HTTP exceptions pass through unchanged
        raise
    except ValueError as e:
        logger.error(f"Database error while retrieving users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error while retrieving users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def create_user_service(user: UserCreate) -> UserRead:
    """
    Create a new user with business logic validation.

    Validates:
    - Email uniqueness
    - Data sanitization
    """
    try:
        existing_users, _ = await users_db.get_users_db(
            [FilterOperation("email", "eq", user.email.strip().lower())], limit=1
        )
        if existing_users:
            logger.error(f"Attempted to create duplicate user with email: {user.email}")
            raise HTTPException(
                status_code=400, detail="A user with this email already exists"
            )

        sanitized_user = UserCreate(
            first_name=user.first_name.strip(),
            last_name=user.last_name.strip(),
            email=user.email.strip().lower(),
            date_of_birth=user.date_of_birth,
            color=user.color.strip() if user.color else None,
        )

        return await users_db.create_user_db(sanitized_user)

    except HTTPException:
        # Let HTTP exceptions pass through unchanged
        raise
    except ValueError as e:
        logger.error(f"Database error while creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error while creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def delete_user_service(user_id: UUID) -> UserRead:
    """
    Delete a user by their user_id.

    Validates:
    - User existence
    """
    try:
        existing_users, _ = await users_db.get_users_db(
            [FilterOperation("user_id", "eq", user_id)], limit=1
        )
        if not existing_users:
            logger.warning(f"Attempted to delete non-existent user with ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        await users_db.delete_user_db(user_id)

        return existing_users[0]

    except HTTPException:
        # Let HTTP exceptions pass through unchanged
        raise
    except ValueError as e:
        logger.error(f"Database error while deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Unexpected error while deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
