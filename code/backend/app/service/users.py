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
from app.models.patch import PatchRequest
from app.models.users import PaginatedUsers, UserBase, UserCreate, UserRead
from app.service.exception_handler import handle_service_exceptions
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


@handle_service_exceptions
async def get_users_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedUsers:
    filters = [parse_filter(f) for f in (filter_expression or [])]

    users, total = await users_db.get_users_db(filters, offset, limit)
    return PaginatedUsers(items=users, total=total, offset=offset, limit=limit)


@handle_service_exceptions
async def create_user_service(user: UserCreate) -> UserRead:
    await UserBase.validate_email_uniqueness(user.email)

    sanitized_user = UserCreate(
        first_name=user.first_name.strip(),
        last_name=user.last_name.strip(),
        email=user.email.strip().lower(),
        date_of_birth=user.date_of_birth,
        color=user.color.strip().lower() if user.color and user.color.strip() else None,
    )

    return await users_db.create_user_db(sanitized_user)


@handle_service_exceptions
async def delete_user_service(user_id: UUID) -> UserRead:
    delete_user, _ = await users_db.get_users_db(
        [FilterOperation("user_id", "eq", user_id)], limit=1
    )
    if not delete_user:
        logger.warning(f"Attempted to delete non-existent user with ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    await users_db.delete_user_db(user_id)
    return delete_user[0]


@handle_service_exceptions
async def patch_users_service(request: PatchRequest) -> dict[UUID, UserRead]:
    updates = await UserBase.validate_patch_operations(request.patch)

    result = await users_db.batch_update_users_db(updates)

    logger.info(f"Successfully updated {len(result)} users in batch operation")
    return result
