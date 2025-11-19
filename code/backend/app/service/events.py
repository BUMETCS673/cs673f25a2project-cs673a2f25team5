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
from app.models.events import EventBase, EventCreate, EventRead, PaginatedEvents
from app.models.patch import PatchRequest
from app.service.exception_handler import handle_service_exceptions
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


@handle_service_exceptions
async def get_events_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedEvents:
    filters = [parse_filter(f) for f in (filter_expression or [])]

    events, total = await events_db.get_events_db(filters, offset, limit)
    return PaginatedEvents(items=events, total=total, offset=offset, limit=limit)


@handle_service_exceptions
async def create_event_service(event: EventCreate) -> EventRead:
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


@handle_service_exceptions
async def delete_event_service(event_id: UUID) -> EventRead:
    delete_event, _ = await events_db.get_events_db(
        [FilterOperation("event_id", "eq", event_id)], limit=1
    )
    if not delete_event:
        logger.warning(f"Attempted to delete non-existent event with ID: {event_id}")
        raise HTTPException(status_code=404, detail="Event not found")

    await events_db.delete_event_db(event_id)
    return delete_event[0]


@handle_service_exceptions
async def patch_events_service(request: PatchRequest) -> dict[UUID, EventRead]:
    validated_updates = await EventBase.validate_patch_operations(request.patch)

    result = await events_db.batch_update_events_db(validated_updates)

    logger.info(f"Successfully updated {len(result)} events in batch operation")
    return result
