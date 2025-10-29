"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging
from uuid import UUID

from fastapi import HTTPException

import app.db.users as users_db
from app.db.filters import FilterOperation
from app.models.exceptions import InvalidColumnError, InvalidFilterFormatError, NotFoundError
from app.models.users import PaginatedUsers, UserCreate, UserRead
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
        raise HTTPException(status_code=400, detail="Invalid filter_expression format") from e
    except InvalidColumnError as e:
        logger.error(f"Invalid column name in filter_expression: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid column name") from e
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
            color=user.color.strip().lower() if user.color and user.color.strip() else None,
        )

        return await users_db.create_user_db(sanitized_user)

    except HTTPException:
        raise
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
