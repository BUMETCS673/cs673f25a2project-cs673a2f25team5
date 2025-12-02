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
from app.models.attendees import AttendeeBase, AttendeeCreate, AttendeeRead, PaginatedAttendees
from app.models.patch import PatchRequest
from app.service.exception_handler import handle_service_exceptions
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


@handle_service_exceptions
async def get_attendees_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedAttendees:
    filters = [parse_filter(f) for f in (filter_expression or [])]

    attendees, total = await attendees_db.get_attendees_db(filters, offset, limit)
    return PaginatedAttendees(items=attendees, total=total, offset=offset, limit=limit)


@handle_service_exceptions
async def create_attendee_service(att: AttendeeCreate) -> AttendeeRead:
    existing_events, _ = await events_db.get_events_db(
        [FilterOperation("event_id", "eq", att.event_id)], limit=1
    )
    if not existing_events:
        logger.warning(f"Event with event_id '{att.event_id}' does not exist.")
        raise HTTPException(status_code=404, detail="No such event exists")

    existing_users, _ = await users_db.get_users_db(
        [FilterOperation("user_id", "eq", att.user_id)], limit=1
    )
    if not existing_users:
        logger.warning(f"User with user_id '{att.user_id}' does not exist.")
        raise HTTPException(status_code=404, detail="No such user exists")

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
        raise HTTPException(status_code=409, detail="User already registered for this event")

    event = existing_events[0]
    if event.capacity is not None:
        _, attendee_total = await attendees_db.get_attendees_db(
            [FilterOperation("event_id", "eq", att.event_id)],
            limit=1,
        )
        if attendee_total >= event.capacity:
            logger.info(
                "Capacity reached for event_id='%s' (capacity=%s, current=%s)",
                att.event_id,
                event.capacity,
                attendee_total,
            )
            raise HTTPException(status_code=400, detail="Event is full")
    # DB will default status to NULL if not provided (meaning no response yet)
    sanitized = AttendeeCreate(
        event_id=att.event_id,
        user_id=att.user_id,
        status=att.status,
    )
    created = await attendees_db.create_attendee_db(sanitized)
    return created


@handle_service_exceptions
async def delete_attendee_service(attendee_id: UUID) -> AttendeeRead:
    to_delete, _ = await attendees_db.get_attendees_db(
        [FilterOperation("attendee_id", "eq", attendee_id)], limit=1
    )
    if not to_delete:
        logger.warning(f"Attempted to delete non-existent attendee with ID: {attendee_id}")
        raise HTTPException(status_code=404, detail="Attendee not found")

    await attendees_db.delete_attendee_db(attendee_id)
    return to_delete[0]


@handle_service_exceptions
async def patch_attendees_service(request: PatchRequest) -> dict[UUID, AttendeeRead]:
    updates = await AttendeeBase.validate_patch_operations(request.patch)

    result = await attendees_db.batch_update_attendees_db(updates)

    logger.info(f"Successfully updated {len(result)} attendees in batch operation")
    return result
