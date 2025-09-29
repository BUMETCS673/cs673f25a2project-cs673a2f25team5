from fastapi import APIRouter, HTTPException
from uuid import UUID

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
    tags=["Events"],
)
async def list_events() -> list[models_events.EventRead]:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "/events/{event_id}",
    response_model=models_events.EventRead,
    summary="Delete an event by the event id",
    tags=["Events"],
)
async def delete_event(event_id: UUID) -> models_events.EventRead:
    raise HTTPException(status_code=501, detail="Not implemented")
