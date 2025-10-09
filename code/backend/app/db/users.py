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
    filters: list[FilterOperation] | None = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[UserRead], int]:
    """
    Get paginated users from the database with optional filters.

    Args:
        filters: Optional list of FilterOperation objects, each containing:
            - field: The column to filter on
            - op: The operator to use (eq, neq, gt, gte, lt, lte, like, ilike)
            - value: The value to compare against
        offset: Number of records to skip (for pagination)
        limit: Maximum number of users to return (default: 100)

    Examples:
        # Get first page of 10 users
        users, total = await get_users_db(limit=10)

        # Get second page of users matching a pattern
        filters = [FilterOperation("first_name", "ilike", "John%")]
        users, total = await get_users_db(filters, offset=10, limit=10)

    Returns:
        A tuple containing:
        - List of UserRead objects matching all the filters (AND condition)
        - Total count of matching records (before pagination)
    """
    try:
        params: dict[str, Any] = {"limit": limit, "offset": offset}

        where_clause: list[str] = []
        if filters:
            for i, f in enumerate(filters):
                param_name = f"{f.field}_{i}"
                where_clause.append(f"{f.field} {f.op} :{param_name}")
                params[param_name] = f.value

        # Construct the base query with WHERE clause if needed
        where_sql = f"WHERE {' AND '.join(where_clause)}" if where_clause else ""

        # Query with pagination
        query = text(f"""
            SELECT *
            FROM Users 
            {where_sql}
            LIMIT :limit 
            OFFSET :offset
        """)

        async with engine.begin() as conn:
            result = await conn.execute(query, params)
            rows = result.fetchall()
            users = [UserRead.model_validate(_row_to_user_dict(row)) for row in rows]

            return users, len(users)

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
