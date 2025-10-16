import logging
from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column, Date, DateTime, String, Table, and_, func, select
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement

from app.db.db import engine, metadata
from app.db.filters import FilterOperation
from app.models.exceptions import InvalidColumnError, NotFoundError
from app.models.users import UserCreate, UserRead

logger = logging.getLogger(__name__)


users = Table(
    "users",
    metadata,
    Column("user_id", SQLAlchemyUUID(as_uuid=True), primary_key=True),
    Column("first_name", String),
    Column("last_name", String),
    Column("date_of_birth", Date),
    Column("email", String, unique=True),
    Column("color", String),
    Column("created_at", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True)),
)


async def get_users_db(
    filters: list[FilterOperation] | None = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[UserRead], int]:
    try:
        query = select(users)
        count_query = select(func.count()).select_from(users)

        if filters:
            conditions: list[ColumnElement[Any]] = []
            for f in filters:
                column = getattr(users.c, f.field, None)
                if column is None:
                    logger.error(f"Invalid filter field: {f.field}")
                    raise InvalidColumnError(f"Invalid column name: {f.field}")

                if f.op == "=":
                    conditions.append(column == f.value)
                elif f.op == "!=":
                    conditions.append(column != f.value)
                elif f.op == ">":
                    conditions.append(column > f.value)
                elif f.op == ">=":
                    conditions.append(column >= f.value)
                elif f.op == "<":
                    conditions.append(column < f.value)
                elif f.op == "<=":
                    conditions.append(column <= f.value)
                elif f.op == "LIKE":
                    conditions.append(column.like(f.value))
                elif f.op == "ILIKE":
                    conditions.append(column.ilike(f.value))

            if conditions:
                where_clause = and_(*conditions)
                query = query.where(where_clause)
                count_query = count_query.where(where_clause)

        # Add a stable ORDER BY to ensure deterministic paging
        query = query.order_by(users.c.user_id).offset(offset).limit(limit)

        async with engine.begin() as conn:
            result = await conn.execute(query)
            rows = result.mappings().all()
            users_list = [UserRead.model_validate(dict(row)) for row in rows]

            count_result = await conn.scalar(count_query)
            total_count = 0 if count_result is None else int(count_result)

            return users_list, total_count
    except InvalidColumnError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while getting users: {str(e)}")
        raise ValueError(f"Database error while getting users: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting users: {str(e)}")
        raise ValueError(f"Unexpected error while getting users: {str(e)}") from e


async def create_user_db(user: UserCreate) -> UserRead:
    try:
        now = datetime.now(UTC)
        values: dict[str, str | date | UUID | datetime | None] = {
            "user_id": uuid4(),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_of_birth": user.date_of_birth,
            "email": user.email,
            "color": user.color,
            "created_at": now,
            "updated_at": now,
        }

        insert_stmt = users.insert().values(values).returning(users)

        async with engine.begin() as conn:
            result = await conn.execute(insert_stmt)
            row = result.mappings().first()

            if not row:
                logger.error("Failed to create user: No row returned")
                raise ValueError("Failed to create user: Database error")

            return UserRead.model_validate(dict(row))

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating user: {str(e)}")
        raise ValueError(f"Database error while creating user: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating user: {str(e)}")
        raise ValueError(f"Unexpected error while creating user: {str(e)}") from e


async def delete_user_db(user_id: UUID) -> None:
    try:
        delete_stmt = users.delete().where(users.c.user_id == user_id)

        async with engine.begin() as conn:
            result = await conn.execute(delete_stmt)

            if result.rowcount == 0:
                logger.error(f"No user found with ID: {user_id}")
                raise NotFoundError(f"No user found with ID: {user_id}")
            elif result.rowcount > 1:
                # This should never happen due to user_id being a primary key
                logger.error(f"Multiple users deleted with ID: {user_id}")
                raise ValueError("Database integrity error: Multiple users deleted")
    except NotFoundError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while deleting user: {str(e)}")
        raise ValueError(f"Database error while deleting user: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while deleting user: {str(e)}")
        raise ValueError(f"Unexpected error while deleting user: {str(e)}") from e
