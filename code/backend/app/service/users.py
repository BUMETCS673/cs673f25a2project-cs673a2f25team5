import logging
from uuid import UUID

from fastapi import HTTPException

import app.db.users as users_db
from app.db.filters import FilterOperation
from app.models.users import PaginatedUsers, UserCreate, UserRead
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def get_users_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedUsers:
    """
    Retrieve users with optional filters, offset, and limit.

    Validates:
    - Limit is a positive integer
    - Offset is non-negative
    - Filters are well-formed
    """
    filters = [parse_filter(f) for f in (filter_expression or [])]
    if filters:
        for f in filters:
            column = getattr(users_db.users.c, f.field, None)
            if column is None:
                logger.error(f"Invalid filter field: {f.field}")
                raise HTTPException(status_code=400, detail=f"Invalid column name: {f.field}")

    users, total = await users_db.get_users_db(filters, offset, limit)
    return PaginatedUsers(items=users, total=total, offset=offset, limit=limit)


async def create_user_service(user: UserCreate) -> UserRead:
    """
    Create a new user with business logic validation.

    Validates:
    - Email uniqueness
    - Data sanitization
    """
    existing_users, _ = await users_db.get_users_db(
        [FilterOperation("email", "eq", user.email.strip().lower())], limit=1
    )
    if existing_users:
        logger.error(f"Attempted to create duplicate user with email: {user.email}")
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    sanitized_user = UserCreate(
        first_name=user.first_name.strip(),
        last_name=user.last_name.strip(),
        email=user.email.strip().lower(),
        date_of_birth=user.date_of_birth,
        color=user.color.strip() if user.color else None,
    )

    return await users_db.create_user_db(sanitized_user)


async def delete_user_service(user_id: UUID) -> UserRead:
    """
    Delete a user by their user_id.

    Validates:
    - User existence
    """
    delete_user, _ = await users_db.get_users_db(
        [FilterOperation("user_id", "eq", user_id)], limit=1
    )
    if not delete_user:
        logger.warning(f"Attempted to delete non-existent user with ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    await users_db.delete_user_db(user_id)
    return delete_user[0]
