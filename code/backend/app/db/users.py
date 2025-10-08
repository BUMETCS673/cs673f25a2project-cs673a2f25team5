import logging
from collections.abc import Sequence
from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.db import engine
from app.db.filters import FilterOperation
from app.models.users import UserCreate, UserRead

logger = logging.getLogger(__name__)


# SQL Queries as constants
INSERT_USER_QUERY = text("""
    INSERT INTO Users (
        first_name,
        last_name,
        date_of_birth,
        email,
        color
    ) VALUES (
        :first_name,
        :last_name,
        :date_of_birth,
        :email,
        :color
    ) RETURNING
        *
""")

DELETE_USER_QUERY = text("""
    DELETE FROM Users 
    WHERE user_id = :user_id
""")

GET_USERS_BASE_QUERY = """
    SELECT 
        *
    FROM Users
"""


def _row_to_user_dict(row: Sequence[Any]) -> dict[str, Any]:
    """Convert a database row to a user dictionary."""
    return {
        "user_id": row[0],
        "first_name": row[1],
        "last_name": row[2],
        "date_of_birth": row[3],
        "email": row[4],
        "color": row[5],
        "created_at": row[6],
        "updated_at": row[7],
    }


async def get_users_db(
    filters: list[FilterOperation] | None = None, limit: int = 100
) -> list[UserRead]:
    """
    Get users from the database with optional filters and limit.

    Args:
        filters: Optional list of FilterOperation objects, each containing:
            - field: The column to filter on
            - op: The operator to use (eq, neq, gt, gte, lt, lte, like, ilike)
            - value: The value to compare against
        limit: Maximum number of users to return (default: 100)

    Examples:
        # Get user by ID
        filters = [FilterOperation("user_id", "eq", some_uuid)]

        # Get users created after a date with matching name pattern, limit to 10
        filters = [
            FilterOperation("created_at", "gt", some_date),
            FilterOperation("first_name", "ilike", "John%")
        ]
        users = await get_users_db(filters, limit=10)

    Returns:
        List of UserRead objects matching all the filters (AND condition),
        up to the specified limit
    """
    try:
        query_parts = [GET_USERS_BASE_QUERY]
        params: dict[str, Any] = {}

        if filters:
            query_parts.append("WHERE")

            for i, f in enumerate(filters):
                param_name = f"{f.field}_{i}"
                operator = "AND" if i > 0 else ""
                query_parts.append(f"{operator} {f.field} {f.op} :{param_name}")
                params[param_name] = f.value

        query_parts.append("LIMIT :limit")
        params["limit"] = limit

        query = text("\n".join(query_parts))

        async with engine.begin() as conn:
            result = await conn.execute(query, params)
            rows = result.fetchall()

            return [UserRead.model_validate(_row_to_user_dict(row)) for row in rows]

    except SQLAlchemyError as e:
        logger.error(f"Database error while getting users: {str(e)}")
        raise ValueError(f"Failed to get users: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting users: {str(e)}")
        raise ValueError("Failed to get users: Internal server error") from e


async def create_user_db(user: UserCreate) -> UserRead:
    """Create a new user in the database."""
    values: dict[str, str | date | None] = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "date_of_birth": user.date_of_birth,
        "email": user.email,
        "color": user.color,
    }

    try:
        async with engine.begin() as conn:
            result = await conn.execute(INSERT_USER_QUERY, values)
            row = result.first()

            if not row:
                logger.error("Failed to create user: No row returned")
                raise ValueError("Failed to create user: Database error")

            return UserRead.model_validate(_row_to_user_dict(row))

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating user: {str(e)}")
        raise ValueError(f"Failed to create user: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating user: {str(e)}")
        raise ValueError("Failed to create user: Internal server error") from e


async def delete_user_db(user_id: UUID) -> None:
    """Delete a user by their user ID."""
    try:
        async with engine.begin() as conn:
            await conn.execute(DELETE_USER_QUERY, {"user_id": user_id})

    except SQLAlchemyError as e:
        logger.error(f"Database error while deleting user: {str(e)}")
        raise ValueError(f"Failed to delete user: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while deleting user: {str(e)}")
        raise ValueError("Failed to delete user: Internal server error") from e
