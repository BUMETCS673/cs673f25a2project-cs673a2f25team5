from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models import events as models_events
from app.models import patch as models_patch

router = APIRouter()


@router.post(
    "/events",
    response_model=models_events.EventRead,
    summary="Create an event",
    tags=["Events"],
)
async def create_event(event: models_events.EventCreate) -> models_events.EventRead:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.patch(
    "/events",
    response_model=models_patch.PatchRequest,
    summary="Patch events using JSON Patch",
    tags=["Events"],
)
async def patch_events(
    request: models_patch.PatchRequest,
) -> models_events.EventRead:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get(
    "/events",
    response_model=list[models_events.EventRead],
    summary="Get a list of events",
    description=(
        "Get events with optional filters.All filters are optional and can be combined."
    ),
    tags=["Events"],
)
async def list_events(
    event_id: UUID | None = None,
    user_id: UUID | None = None,
    category_id: UUID | None = None,
    event_date: date | None = None,
) -> list[models_events.EventRead]:
    """
    Get a list of events with optional filters:
    - event_id: Filter by specific event ID
    - user_id: Filter events by creator
    - category_id: Filter events by category
    - event_date: Filter events occurring on a specific date (YYYY-MM-DD)
    """
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "/events/{event_id}",
    response_model=models_events.EventRead,
    summary="Delete an event by the event id",
    tags=["Events"],
)
async def delete_event(event_id: UUID) -> models_events.EventRead:
    raise HTTPException(status_code=501, detail="Not implemented")
