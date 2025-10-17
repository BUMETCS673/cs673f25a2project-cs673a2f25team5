"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    and_,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement

from app.db.db import engine
from app.db.filters import FilterOperation
from app.models.events import EventCreate, EventRead
from app.models.exceptions import InvalidColumnError, NotFoundError

logger = logging.getLogger(__name__)


metadata = MetaData()
events = Table(
    "events",
    metadata,
    Column("event_id", SQLAlchemyUUID(as_uuid=True), primary_key=True),
    Column("event_name", String(100), nullable=False),
    Column("event_datetime", DateTime(timezone=True), nullable=False),
    Column("event_endtime", DateTime(timezone=True), nullable=False),
    Column("event_location", String(255)),
    Column("description", Text),
    Column("picture_url", String(255)),
    Column("capacity", Integer),
    Column("price_field", Integer),
    Column("user_id", SQLAlchemyUUID(as_uuid=True), nullable=False),
    Column("category_id", SQLAlchemyUUID(as_uuid=True), nullable=False),
    Column("created_at", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True)),
)


async def get_events_db(
    filters: list[FilterOperation] | None = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[EventRead], int]:
    try:
        query = select(events)
        count_query = select(func.count()).select_from(events)

        if filters:
            conditions: list[ColumnElement[Any]] = []
            for f in filters:
                column = getattr(events.c, f.field, None)
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
        query = query.order_by(events.c.event_id).offset(offset).limit(limit)

        async with engine.begin() as conn:
            result = await conn.execute(query)
            rows = result.mappings().all()
            events_list = [EventRead.model_validate(dict(row)) for row in rows]

            count_result = await conn.scalar(count_query)
            total_count = 0 if count_result is None else int(count_result)

            return events_list, total_count
    except InvalidColumnError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while getting events: {str(e)}")
        raise ValueError(f"Database error while getting events: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting events: {str(e)}")
        raise ValueError(f"Unexpected error while getting events: {str(e)}") from e


async def create_event_db(event: EventCreate) -> EventRead:
    """Create a new event in the database."""
    try:
        now = datetime.now(UTC)
        values: dict[str, str | int | datetime | UUID | None] = {
            "event_id": uuid4(),
            "event_name": event.event_name,
            "event_datetime": event.event_datetime,
            "event_endtime": event.event_endtime,
            "event_location": event.event_location,
            "description": event.description,
            "picture_url": event.picture_url,
            "capacity": event.capacity,
            "price_field": event.price_field,
            "user_id": event.user_id,
            "category_id": event.category_id,
            "created_at": now,
            "updated_at": now,
        }

        insert_stmt = events.insert().values(values).returning(events)

        async with engine.begin() as conn:
            result = await conn.execute(insert_stmt)
            row = result.mappings().first()

            if not row:
                logger.error("Failed to create event: No row returned")
                raise ValueError("Failed to create event: Database error")

            return EventRead.model_validate(dict(row))

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating event: {str(e)}")
        raise ValueError(f"Database error while creating event: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating event: {str(e)}")
        raise ValueError(f"Unexpected error while creating event: {str(e)}") from e


async def delete_event_db(event_id: UUID) -> None:
    try:
        delete_stmt = events.delete().where(events.c.event_id == event_id)

        async with engine.begin() as conn:
            result = await conn.execute(delete_stmt)

            if result.rowcount == 0:
                logger.error(f"No event found with ID: {event_id}")
                raise NotFoundError(f"No event found with ID: {event_id}")
            elif result.rowcount > 1:
                # This should never happen due to event_id being a primary key
                logger.error(f"Multiple events deleted with ID: {event_id}")
                raise ValueError("Database integrity error: Multiple events deleted")

    except SQLAlchemyError as e:
        logger.error(f"Database error while deleting event: {str(e)}")
        raise ValueError(f"Database error while deleting event: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while deleting event: {str(e)}")
        raise ValueError(f"Unexpected error while deleting event: {str(e)}") from e
