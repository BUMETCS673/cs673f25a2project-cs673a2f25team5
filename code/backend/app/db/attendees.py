"""
AI-generated code: 80%
Human code: 20%
Framework-generated code: 0%
"""

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Column,
    DateTime,
    MetaData,
    String,
    Table,
    and_,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID, ENUM as PG_ENUM
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement

from app.db.db import engine, metadata
from app.db.filters import FilterOperation
from app.models.attendees import AttendeeCreate, AttendeeRead, AttendeeStatus
from app.models.exceptions import InvalidColumnError, NotFoundError

logger = logging.getLogger(__name__)

# Map to existing DB enum type created by init SQL: attendee_status
attendee_status = PG_ENUM(
    "RSVPed",
    "Maybe",
    "Not Going",
    name="attendee_status",
    create_type=False,  # Type already exists in DB from init script
)

eventattendees = Table(
    "eventattendees",
    metadata,
    Column("attendee_id", SQLAlchemyUUID(as_uuid=True), primary_key=True),
    Column("event_id", SQLAlchemyUUID(as_uuid=True), nullable=False),
    Column("user_id", SQLAlchemyUUID(as_uuid=True), nullable=False),
    Column("status", attendee_status, nullable=True),
    Column("created_at", DateTime(timezone=True)),
    Column("updated_at", DateTime(timezone=True)),
)


async def get_attendees_db(
    filters: list[FilterOperation] | None = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[AttendeeRead], int]:
    """
    Returns attendees using the same filtering/paging pattern as users/events.
    """
    try:
        query = select(eventattendees)
        count_query = select(func.count()).select_from(eventattendees)

        if filters:
            conditions: list[ColumnElement[Any]] = []
            for f in filters:
                column = getattr(eventattendees.c, f.field, None)
                if column is None:
                    logger.error(f"Invalid filter_expression field: {f.field}")
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

        # Stable paging
        query = query.order_by(eventattendees.c.attendee_id).offset(offset).limit(limit)

        async with engine.begin() as conn:
            result = await conn.execute(query)
            rows = result.mappings().all()
            items = [
                AttendeeRead.model_validate(
                    {
                        **dict(row),
                        # Ensure enum is serialized as our AttendeeStatus
                        "status": AttendeeStatus(row["status"]) if row["status"] is not None else AttendeeStatus.RSVPED,
                    }
                )
                for row in rows
            ]

            total_val = await conn.scalar(count_query)
            total = 0 if total_val is None else int(total_val)

            return items, total

    except InvalidColumnError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while getting attendees: {str(e)}")
        raise ValueError(f"Database error while getting attendees: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting attendees: {str(e)}")
        raise ValueError(f"Unexpected error while getting attendees: {str(e)}") from e


async def create_attendee_db(att: AttendeeCreate) -> AttendeeRead:
    """
    Creates an attendee row; mirrors create_user_db/create_event_db.
    DB has defaults for status (nullable → default NULL; we prefer explicit).
    """
    try:
        now = datetime.now(UTC)
        values: dict[str, Any] = {
            "attendee_id": uuid4(),
            "event_id": att.event_id,
            "user_id": att.user_id,
            "status": (att.status.value if att.status else AttendeeStatus.RSVPED.value),
            "created_at": now,
            "updated_at": now,
        }

        insert_stmt = eventattendees.insert().values(values).returning(eventattendees)

        async with engine.begin() as conn:
            result = await conn.execute(insert_stmt)
            row = result.mappings().first()

            if not row:
                logger.error("Failed to create attendee: No row returned")
                raise ValueError("Failed to create attendee: Database error")

            data = dict(row)
            data["status"] = AttendeeStatus(data["status"])
            return AttendeeRead.model_validate(data)

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating attendee: {str(e)}")
        raise ValueError(f"Database error while creating attendee: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating attendee: {str(e)}")
        raise ValueError(f"Unexpected error while creating attendee: {str(e)}") from e


async def delete_attendee_db(attendee_id: UUID) -> None:
    """
    Deletes attendee by primary key; mirrors delete_user_db/delete_event_db.
    """
    try:
        delete_stmt = eventattendees.delete().where(eventattendees.c.attendee_id == attendee_id)

        async with engine.begin() as conn:
            result = await conn.execute(delete_stmt)

            if result.rowcount == 0:
                logger.error(f"No attendee found with ID: {attendee_id}")
                raise NotFoundError(f"No attendee found with ID: {attendee_id}")
            elif result.rowcount > 1:
                # Should never happen (PK)
                logger.error(f"Multiple attendees deleted with ID: {attendee_id}")
                raise ValueError("Database integrity error: Multiple attendees deleted")

    except NotFoundError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while deleting attendee: {str(e)}")
        raise ValueError(f"Database error while deleting attendee: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while deleting attendee: {str(e)}")
        raise ValueError(f"Unexpected error while deleting attendee: {str(e)}") from e
