"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging
from uuid import UUID

from fastapi import HTTPException

import app.db.categories as categories_db
import app.db.events as events_db
import app.db.users as users_db
from app.db.filters import FilterOperation
from app.models.events import EventCreate, EventRead, PaginatedEvents
from app.models.exceptions import InvalidColumnError, InvalidFilterFormatError, NotFoundError
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def get_events_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedEvents:
    try:
        filters = [parse_filter(f) for f in (filter_expression or [])]

        events, total = await events_db.get_events_db(filters, offset, limit)
        return PaginatedEvents(items=events, total=total, offset=offset, limit=limit)

    except InvalidFilterFormatError as e:
        logger.error(f"Invalid filter_expression format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid filter_expression format") from e
    except InvalidColumnError as e:
        logger.error(f"Invalid column name in filter_expression: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid column name") from e
    except ValueError as e:
        # Database errors
        logger.error(f"Database error while retrieving events: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while retrieving events: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def create_event_service(event: EventCreate) -> EventRead:
    try:
        existing_users, _ = await users_db.get_users_db(
            [FilterOperation("user_id", "eq", event.user_id)], limit=1
        )
        if not existing_users:
            logger.warning(f"User with user_id '{event.user_id}' does not exist.")
            raise HTTPException(status_code=404, detail="No such user exists")

        existing_categories, _ = await categories_db.get_categories_db(
            [FilterOperation("category_id", "eq", event.category_id)], limit=1
        )
        if not existing_categories:
            logger.warning(f"Category with category_id '{event.category_id}' does not exist.")
            raise HTTPException(status_code=404, detail="No such category exists")

        sanitized_event = EventCreate(
            event_name=event.event_name.strip(),
            event_datetime=event.event_datetime,
            event_endtime=event.event_endtime,
            event_location=event.event_location.strip() if event.event_location else None,
            description=event.description.strip() if event.description else None,
            picture_url=event.picture_url.strip() if event.picture_url else None,
            capacity=event.capacity,
            price_field=event.price_field,
            user_id=event.user_id,
            category_id=event.category_id,
        )

        return await events_db.create_event_db(sanitized_event)

    except HTTPException:
        raise
    except ValueError as e:
        # Database errors from the db layer
        logger.error(f"Database error while creating event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while creating event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e


async def delete_event_service(event_id: UUID) -> EventRead:
    try:
        delete_event, _ = await events_db.get_events_db(
            [FilterOperation("event_id", "eq", event_id)], limit=1
        )
        if not delete_event:
            logger.warning(f"Attempted to delete non-existent event with ID: {event_id}")
            raise HTTPException(status_code=404, detail="Event not found")

        await events_db.delete_event_db(event_id)
        return delete_event[0]

    except HTTPException:
        raise
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail="Event not found") from e
    except ValueError as e:
        # Database errors from the db layer
        logger.error(f"Database error while deleting event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error while deleting event: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error") from e
