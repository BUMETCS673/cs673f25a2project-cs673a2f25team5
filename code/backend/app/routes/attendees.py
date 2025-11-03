"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

from uuid import UUID

from fastapi import APIRouter, Query, status

from app.models import attendees as models_attendees
from app.service import attendees as attendees_service

router = APIRouter()


FILTER_QUERY = Query(
    None,
    description="Filter in the format field:operator:value. Can be used multiple times.",
    examples=[
        "event_id:eq:550e8400-e29b-41d4-a716-446655440000",
        "user_id:eq:550e8400-e29b-41d4-a716-446655440000",
        "status:eq:RSVPed",
    ],
)
OFFSET_QUERY = Query(0, ge=0, description="Number of records to skip")
LIMIT_QUERY = Query(100, ge=1, le=1000, description="Maximum number of attendees to return")


@router.get(
    "/attendees",
    response_model=models_attendees.PaginatedAttendees,
    summary="Get a paginated list of attendees",
    description=(
        "Get attendees with optional filters using the format `field:operator:value`. "
        "Multiple filters can be combined using multiple `filter_expression` params.\n\n"
        "Available operators: eq, neq, gt, gte, lt, lte, like, ilike\n\n"
        "Examples:\n"
        "- `/attendees?filter_expression=event_id:eq:<uuid>`\n"
        "- `/attendees?filter_expression=user_id:eq:<uuid>&filter_expression=status:eq:RSVPed`"
    ),
    tags=["Attendees"],
    responses={
        200: {"description": "Paginated list of attendees"},
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
async def list_attendees(
    filter_expression: list[str] | None = FILTER_QUERY,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
) -> models_attendees.PaginatedAttendees:
    return await attendees_service.get_attendees_service(filter_expression, offset, limit)


@router.post(
    "/attendees",
    response_model=models_attendees.AttendeeRead,
    summary="Register a user for an event",
    description="Creates an attendee row for (event_id, user_id). Prevents duplicates.",
    tags=["Attendees"],
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Attendee created"},
        404: {
            "description": "Event or user not found",
            "content": {
                "application/json": {"example": {"detail": "Event or user not found"}}
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def create_attendee(
    attendee: models_attendees.AttendeeCreate,
) -> models_attendees.AttendeeRead:
    return await attendees_service.create_attendee_service(attendee)


@router.delete(
    "/attendees/{attendee_id}",
    response_model=models_attendees.AttendeeRead,
    summary="Unregister attendee (delete by attendee_id)",
    tags=["Attendees"],
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Attendee deleted and returned"},
        404: {
            "description": "Attendee not found",
            "content": {"application/json": {"example": {"detail": "Attendee not found"}}},
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def delete_attendee(attendee_id: UUID) -> models_attendees.AttendeeRead:
    return await attendees_service.delete_attendee_service(attendee_id)
    