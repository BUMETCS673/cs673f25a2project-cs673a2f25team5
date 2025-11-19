"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import logging
from datetime import UTC, date, datetime
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, String, Table, and_, func, select
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import ColumnElement

from app.db.db import engine, metadata
from app.db.filters import FilterOperation
from app.models.exceptions import InvalidColumnError, NotFoundError
from app.models.invitations import InvitationsCreate, InvitationsReadDB, InvitationStatus

logger = logging.getLogger(__name__)

# Map to existing DB enum type created by init SQL: invitation_status
invitation_status = PG_ENUM(
    "Active",
    "Expired",
    "Revoked",
    name="invitation_status",
    create_type=False,  # Type already exists in DB from init script
)

invitations = Table(
    "invitations",
    metadata,
    Column("invitation_id", SQLAlchemyUUID(as_uuid=True), primary_key=True),
    Column("event_id", SQLAlchemyUUID(as_uuid=True), nullable=False),
    Column("user_id", SQLAlchemyUUID(as_uuid=True), nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
    Column("token_hash", String(64), unique=True, nullable=False),
    Column("status", cast(Any, invitation_status), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)


async def create_invitation_db(
    invitation: InvitationsCreate, token_hash: str
) -> InvitationsReadDB:
    try:
        now = datetime.now(UTC)
        values: dict[str, str | date | UUID | datetime | None] = {
            "invitation_id": uuid4(),
            "event_id": invitation.event_id,
            "user_id": invitation.user_id,
            "expires_at": invitation.expires_at,
            "token_hash": token_hash,
            "status": InvitationStatus.ACTIVE.value,
            "created_at": now,
            "updated_at": now,
        }

        insert_stmt = invitations.insert().values(values).returning(invitations)

        async with engine.begin() as conn:
            result = await conn.execute(insert_stmt)
            row = result.mappings().first()

            if not row:
                logger.error("Failed to create invitation: No row returned")
                raise ValueError("Failed to create invitation: Database error")

            return InvitationsReadDB.model_validate(dict(row))

    except SQLAlchemyError as e:
        logger.error(f"Database error while creating invitation: {str(e)}")
        raise ValueError(f"Database error while creating invitation: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating invitation: {str(e)}")
        raise ValueError(f"Unexpected error while creating invitation: {str(e)}") from e


async def get_invitations_db(
    filters: list[FilterOperation] | None = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[list[InvitationsReadDB], int]:
    """
    Get invitations from the database with optional filtering and pagination.

    Args:
        filters: List of filter operations to apply
        offset: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Tuple of (list of invitations, total count)
    """
    try:
        query = select(invitations)
        count_query = select(func.count()).select_from(invitations)

        if filters:
            conditions: list[ColumnElement[Any]] = []
            for f in filters:
                column = getattr(invitations.c, f.field, None)
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

        # Add a stable ORDER BY to ensure deterministic paging
        query = query.order_by(invitations.c.invitation_id).offset(offset).limit(limit)

        async with engine.begin() as conn:
            result = await conn.execute(query)
            rows = result.mappings().all()
            invitations_list = [InvitationsReadDB.model_validate(dict(row)) for row in rows]

            count_result = await conn.scalar(count_query)
            total_count = 0 if count_result is None else int(count_result)

            return invitations_list, total_count
    except InvalidColumnError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while getting invitations: {str(e)}")
        raise ValueError(f"Database error while getting invitations: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while getting invitations: {str(e)}")
        raise ValueError(f"Unexpected error while getting invitations: {str(e)}") from e


async def batch_update_invitations_db(
    updates: dict[UUID, dict[str, Any]],
) -> dict[UUID, InvitationsReadDB]:
    try:
        now = datetime.now(UTC)
        result: dict[UUID, InvitationsReadDB] = {}

        async with engine.begin() as conn:
            for invitation_id in updates.keys():
                select_stmt = select(invitations).where(
                    invitations.c.invitation_id == invitation_id
                )
                check_result = await conn.execute(select_stmt)
                if not check_result.fetchone():
                    logger.error(f"No invitation found with ID: {invitation_id}")
                    raise NotFoundError(f"No invitation found with ID: {invitation_id}")

            for invitation_id, update_data in updates.items():
                update_data_with_timestamp: dict[str, Any] = {
                    **update_data,
                    "updated_at": now,
                }

                update_stmt = (
                    invitations.update()
                    .where(invitations.c.invitation_id == invitation_id)
                    .values(**update_data_with_timestamp)
                )

                update_result = await conn.execute(update_stmt)

                if update_result.rowcount != 1:
                    logger.error(
                        f"Failed to update invitation {invitation_id}: "
                        f"{update_result.rowcount} rows affected"
                    )
                    raise ValueError(
                        "Database integrity error: Expected 1 row updated for invitation "
                        f"{invitation_id}, got {update_result.rowcount}"
                    )

                select_stmt = select(invitations).where(
                    invitations.c.invitation_id == invitation_id
                )
                fetch_result = await conn.execute(select_stmt)
                row = fetch_result.mappings().first()
                if not row:
                    logger.error(f"Updated invitation not found: {invitation_id}")
                    raise NotFoundError(f"Updated invitation not found: {invitation_id}")

                result[invitation_id] = InvitationsReadDB.model_validate(dict(row))

            return result

    except NotFoundError:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error while batch updating invitations: {str(e)}")
        raise ValueError(f"Database error while batch updating invitations: {str(e)}") from e
    except Exception as e:
        logger.error(f"Unexpected error while batch updating invitations: {str(e)}")
        raise ValueError(f"Unexpected error while batch updating invitations: {str(e)}") from e
