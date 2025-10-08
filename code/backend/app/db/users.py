from datetime import date
from typing import Any, Sequence
import logging
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.db import engine
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

GET_USER_BY_EMAIL_QUERY = text("""
    SELECT 
        *
    FROM Users 
    WHERE email = :email
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

            if row is None:
                logger.error("Failed to create user: No row returned")
                raise ValueError("Failed to create user: Database error")

            return UserRead.model_validate(_row_to_user_dict(row))

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating user: {str(e)}")
        raise ValueError(f"Failed to create user: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating user: {str(e)}")
        raise ValueError("Failed to create user: Internal server error") from e


async def get_user_by_email_db(email: str) -> UserRead | None:
    """Get a user by their email address."""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                GET_USER_BY_EMAIL_QUERY,
                {"email": email}
            )
            row = result.first()

            if row is None:
                logger.debug(f"No user found with email: {email}")
                return None

            return UserRead.model_validate(_row_to_user_dict(row))

    except SQLAlchemyError as e:
        logger.error(f"Database error while getting user by email: {str(e)}")
        raise ValueError(f"Failed to get user: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting user by email: {str(e)}")
        raise ValueError("Failed to get user: Internal server error") from e
