"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging
from uuid import UUID

from fastapi import HTTPException

import app.db.attendees as attendees_db
import app.db.events as events_db
import app.db.users as users_db
from app.db.filters import FilterOperation
from app.models.attendees import AttendeeCreate, AttendeeRead, PaginatedAttendees
from app.models.exceptions import InvalidColumnError, InvalidFilterFormatError, NotFoundError
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def get_attendees_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedAttendees:
    try:
        filters = [parse_filter(f) for f in (filter_expression or [])]

        attendees, total = await attendees_db.get_attendees_db(filters, offset, limit)
        return PaginatedAttendees(items=attendees, total=total, offset=offset, limit=limit)

    except InvalidFilterFormatError as e:
        logger.error(f"Invalid filter_expression format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid filter_expression format") from e
    except InvalidColumnError as e:
        logger.error(f"Invalid column name in filter_expression: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid column name") from e
    except ValueError as e:
        logger.error(f"Database error while retrieving attendees: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        logger.error(f"Unexpected error while retrieving attendees: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def create_attendee_service(att: AttendeeCreate) -> AttendeeRead:
    try:
        # ensure event exists
        existing_events, _ = await events_db.get_events_db(
            [FilterOperation("event_id", "eq", att.event_id)], limit=1
        )
        if not existing_events:
            logger.warning(f"Event with event_id '{att.event_id}' does not exist.")
            raise HTTPException(status_code=404, detail="No such event exists")

        # ensure user exists
        existing_users, _ = await users_db.get_users_db(
            [FilterOperation("user_id", "eq", att.user_id)], limit=1
        )
        if not existing_users:
            logger.warning(f"User with user_id '{att.user_id}' does not exist.")
            raise HTTPException(status_code=404, detail="No such user exists")

        # prevent duplicate (same event_id + user_id)
        existing_attendees, _ = await attendees_db.get_attendees_db(
            [
                FilterOperation("event_id", "eq", att.event_id),
                FilterOperation("user_id", "eq", att.user_id),
            ],
            limit=1,
        )
        if existing_attendees:
            logger.info(
                "Duplicate registration blocked for "
                f"user_id='{att.user_id}' on event_id='{att.event_id}'"
            )
            raise HTTPException(
                status_code=409, detail="User already registered for this event"
            )

            # DB will default status to NULL if not provided (meaning no response yet)

        # DB will default status to RSVPed if not provided (enum default in schema)
        sanitized = AttendeeCreate(
            event_id=att.event_id,
            user_id=att.user_id,
            status=att.status,
        )
        created = await attendees_db.create_attendee_db(sanitized)
        return created

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Database error while creating attendee: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        logger.error(f"Unexpected error while creating attendee: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def delete_attendee_service(attendee_id: UUID) -> AttendeeRead:
    try:
        to_delete, _ = await attendees_db.get_attendees_db(
            [FilterOperation("attendee_id", "eq", attendee_id)], limit=1
        )
        if not to_delete:
            logger.warning(f"Attempted to delete non-existent attendee with ID: {attendee_id}")
            raise HTTPException(status_code=404, detail="Attendee not found")

        await attendees_db.delete_attendee_db(attendee_id)
        return to_delete[0]

    except HTTPException:
        raise
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail="Attendee not found") from e
    except ValueError as e:
        logger.error(f"Database error while deleting attendee: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        logger.error(f"Unexpected error while deleting attendee: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
