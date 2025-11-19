"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

from uuid import UUID

from fastapi import APIRouter, Query

from app.models import events as models_events
from app.models import patch as models_patch
from app.service import events as events_service

router = APIRouter()


FILTER_QUERY = Query(
    None,
    description="Filter in the format field:operator:value. Can be used multiple times.",
    examples=["event_name:ilike:Party%", "user_id:eq:550e8400-e29b-41d4-a716-446655440000"],
)
OFFSET_QUERY = Query(0, ge=0, description="Number of records to skip")
LIMIT_QUERY = Query(100, ge=1, le=1000, description="Maximum number of events to return")


@router.get(
    "/events",
    response_model=models_events.PaginatedEvents,
    summary="Get a paginated list of events",
    description=(
        "Get events with optional filters using the format `field:operator:value`. "
        "Multiple filters can be combined using multiple filter_expression parameters.\n\n"
        "Available operators: eq, neq, gt, gte, lt, lte, like, ilike\n\n"
        "Pagination is supported via offset and limit parameters.\n\n"
        "Examples:\n"
        "- `/events?filter_expression=event_name:ilike:Party%`\n"
        "- `/events?offset=20&limit=10` (get third page of 10 events)"
    ),
    tags=["Events"],
    responses={
        200: {"description": "Paginated list of events"},
        400: {
            "description": "Invalid parameters",
            "content": {
                "application/json": {
                    "examples": {
                        "InvalidFilterFormat": {
                            "summary": "Invalid filter_expression format",
                            "value": {"detail": "Invalid filter_expression format"},
                        },
                        "InvalidColumnName": {
                            "summary": "Invalid column name",
                            "value": {"detail": "Invalid column name"},
                        },
                        "LimitNotPositive": {
                            "summary": "Limit must be a positive integer",
                            "value": {"detail": "Limit must be a positive integer"},
                        },
                        "OffsetNegative": {
                            "summary": "Offset must be non-negative",
                            "value": {"detail": "Offset must be non-negative"},
                        },
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def list_events(
    filter_expression: list[str] | None = FILTER_QUERY,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
) -> models_events.PaginatedEvents:
    return await events_service.get_events_service(filter_expression, offset, limit)


@router.post(
    "/events",
    response_model=models_events.EventRead,
    summary="Create a new event",
    description="Create a new event with the provided information.",
    tags=["Events"],
    status_code=201,
    responses={
        201: {"description": "Event created successfully"},
        400: {
            "description": "Invalid input data",
            "content": {
                "application/json": {
                    "examples": {
                        "InvalidData": {
                            "summary": "Invalid event data",
                            "value": {"detail": "Event end time must be after start time"},
                        }
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def create_event(event: models_events.EventCreate) -> models_events.EventRead:
    return await events_service.create_event_service(event)


@router.patch(
    "/events",
    response_model=dict[UUID, models_events.EventRead],
    summary="Patch multiple events using JSON Patch operations",
    description=(
        "Apply JSON Patch operations to multiple events. Each operation is applied to a "
        "specific event identified by UUID. Returns a dictionary mapping event IDs to their "
        "updated Event models.\n\n"
        "JSON Patch operations supported:\n"
        "- `replace`: Replace a field value\n"
        "Example request body:\n"
        "```json\n"
        "{\n"
        '  "patch": {\n'
        '    "550e8400-e29b-41d4-a716-446655440001": {\n'
        '      "op": "replace",\n'
        '      "path": "/event_name",\n'
        '      "value": "Updated Event Name"\n'
        "    }\n"
        "  }\n"
        "}\n"
        "```"
    ),
    tags=["Events"],
    responses={
        200: {"description": "Events patched successfully"},
        400: {
            "description": "Invalid patch operation or data",
            "content": {
                "application/json": {
                    "examples": {
                        "InvalidOperation": {
                            "summary": "Invalid JSON Patch operation",
                            "value": {"detail": "Invalid operation: unsupported_op"},
                        },
                        "InvalidPath": {
                            "summary": "Invalid field path",
                            "value": {"detail": "Invalid path: /invalid_field"},
                        },
                        "InvalidValue": {
                            "summary": "Invalid field value",
                            "value": {"detail": "Invalid value for field: start_time"},
                        },
                    }
                }
            },
        },
        404: {
            "description": "One or more events not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Event not found: 550e8400-e29b-41d4-a716-446655440001"
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def patch_events(
    request: models_patch.PatchRequest,
) -> dict[UUID, models_events.EventRead]:
    return await events_service.patch_events_service(request)


@router.delete(
    "/events/{event_id}",
    response_model=models_events.EventRead,
    summary="Delete an event by event ID",
    description="Delete an event and return the deleted event data.",
    tags=["Events"],
    responses={
        200: {"description": "Event deleted successfully"},
        400: {
            "description": "Invalid input",
            "content": {"application/json": {"example": {"detail": "Invalid event ID"}}},
        },
        404: {
            "description": "Event not found",
            "content": {"application/json": {"example": {"detail": "Event not found"}}},
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def delete_event(event_id: UUID) -> models_events.EventRead:
    return await events_service.delete_event_service(event_id)
