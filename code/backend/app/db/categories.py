import logging
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column, MetaData, String, Table, Text, and_, select
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement

from app.db.db import engine
from app.db.filters import FilterOperation
from app.models.exceptions import InvalidColumnError

logger = logging.getLogger(__name__)


metadata = MetaData()
categories = Table(
    "categories",
    metadata,
    Column("category_id", SQLAlchemyUUID(as_uuid=True), primary_key=True),
    Column("category_name", String(50), nullable=False),
    Column("description", Text),
)


async def get_categories_db(
    filters: list[FilterOperation] | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    try:
        query = select(categories)

        if filters:
            conditions: list[ColumnElement[Any]] = []
            for f in filters:
                column = getattr(categories.c, f.field, None)
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

        query = query.limit(limit)

        async with engine.begin() as conn:
            result = await conn.execute(query)
            rows = result.mappings().all()
            return [dict(row) for row in rows]

    except InvalidColumnError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while getting categories: {str(e)}")
        raise ValueError(f"Database error while getting categories: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting categories: {str(e)}")
        raise ValueError(f"Unexpected error while getting categories: {str(e)}") from e


async def create_category_db(category_name: str, description: str | None = None) -> UUID:
    """Create a new category in the database."""
    try:
        category_id = uuid4()
        values: dict[str, str | UUID | None] = {
            "category_id": category_id,
            "category_name": category_name,
            "description": description,
        }

        insert_stmt = categories.insert().values(values)

        async with engine.begin() as conn:
            await conn.execute(insert_stmt)
            return category_id

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating category: {str(e)}")
        raise ValueError(f"Database error while creating category: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating category: {str(e)}")
        raise ValueError(f"Unexpected error while creating category: {str(e)}") from e
