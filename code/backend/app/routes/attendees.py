from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models import attendees as models_attendees
from app.models import patch as models_patch

router = APIRouter()


@router.post(
    "/attendees",
    response_model=models_attendees.AttendeeRead,
    summary="Create an event attendance record",
    tags=["Attendees"],
)
async def create_attendee(
    attendee: models_attendees.AttendeeCreate,
) -> models_attendees.AttendeeRead:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.patch(
    "/attendees",
    response_model=models_patch.PatchRequest,
    summary="Patch events using JSON Patch",
    tags=["Attendees"],
)
async def patch_events(
    request: models_patch.PatchRequest,
) -> models_attendees.AttendeeRead:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/attendees",
    response_model=models_attendees.AttendeeRead,
    summary="Get a list of attendees",
    description=(
        "Get attendees with optional filters. All filters are optional and can be combined."
    ),
    tags=["Attendees"],
)
async def list_attendee(
    event_id: UUID | None = None,
    user_id: UUID | None = None,
    status: models_attendees.AttendeeStatus | None = None,
) -> list[models_attendees.AttendeeRead]:
    """Get a list of attendees with optional filters:
    - event_id: Filter by specific event ID
    - user_id: Filter by specific user ID
    - status: Filter by attendee status (RSVPed, Maybe, Not Going, Null)
    """
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "attendees/{attendee_id}",
    response_model=models_attendees.AttendeeRead,
    summary="Remove an attendee from an event",
    tags=["Attendees"],
)
async def delete_attendee(attendee_id: UUID) -> models_attendees.AttendeeRead:
    raise HTTPException(status_code=501, detail="Not implemented")
