"""
AI-generated code: 50%

Human code: 50%

Framework-generated code: 0%
"""

from uuid import UUID

from fastapi import APIRouter, Query

from app.models import invitations as models_invitations
from app.models import patch as models_patch
from app.service import invitations as service_invitations

router = APIRouter()


FILTER_QUERY = Query(
    None,
    description="Filter in the format field:operator:value. Can be used multiple times.",
    examples=[
        "event_id:eq:550e8400-e29b-41d4-a716-446655440000",
        "user_id:eq:550e8400-e29b-41d4-a716-446655440000",
        "status:eq:Active",
    ],
)
OFFSET_QUERY = Query(0, ge=0, description="Number of records to skip")
LIMIT_QUERY = Query(100, ge=1, le=1000, description="Maximum number of invitations to return")


@router.get(
    "/invitations",
    response_model=models_invitations.PaginatedInvitations,
    summary="Get a paginated list of invitations",
    description=(
        "Get invitations with optional filters using the format `field:operator:value`. "
        "Multiple filters can be combined using multiple filter_expression parameters.\n\n"
        "Available operators: eq, neq, gt, gte, lt, lte, like, ilike\n\n"
        "Pagination is supported via offset and limit parameters.\n\n"
        "Examples:\n"
        "- `/invitations?filter_expression=status:eq:Active`\n"
        "- `/invitations?filter_expression=event_id:eq:550e8400-e29b-41d4-a716-446655440000`\n"
        "- `/invitations?offset=20&limit=10` (get third page of 10 invitations)"
    ),
    tags=["Invitations"],
    responses={
        200: {"description": "Paginated list of invitations"},
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
async def list_invitations(
    filter_expression: list[str] | None = FILTER_QUERY,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
) -> models_invitations.PaginatedInvitations:
    return await service_invitations.get_invitations_service(filter_expression, offset, limit)


@router.post(
    "/invitations",
    response_model=models_invitations.InvitationsRead,
    summary="Invite a user providing a link to accept the invitation",
    tags=["Invitations"],
    status_code=201,
    responses={
        201: {"description": "Invitation created successfully"},
        400: {
            "description": "Invalid input data",
            "content": {
                "application/json": {"example": {"detail": "Invalid invitation data"}}
            },
        },
        404: {
            "description": "User or event not found",
            "content": {"application/json": {"example": {"detail": "User not found"}}},
        },
        409: {
            "description": "Duplicate invitation - an active invitation already exists",
            "content": {
                "application/json": {
                    "example": {"detail": "An active invitation already exists for this event"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def create_invitation(
    invitation: models_invitations.InvitationsCreate,
) -> models_invitations.InvitationsRead:
    return await service_invitations.create_invitation(invitation)


@router.get(
    "/invitations/{token}",
    response_model=models_invitations.InvitationsDetailResponse,
    summary="Get invitation details by token",
    tags=["Invitations"],
    status_code=200,
    responses={
        200: {
            "description": "Invitation details retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "invitation_id": "123e4567-e89b-12d3-a456-426614174000",
                        "event_id": "123e4567-e89b-12d3-a456-426614174001",
                        "user_id": "123e4567-e89b-12d3-a456-426614174002",
                        "status": "Active",
                        "expires_at": "2025-11-20T00:00:00Z",
                        "created_at": "2025-11-18T10:00:00Z",
                        "updated_at": "2025-11-18T10:00:00Z",
                        "event": {
                            "event_name": "Tech Conference 2025",
                            "event_datetime": "2025-11-25T09:00:00Z",
                            "event_location": "Boston Convention Center",
                        },
                        "user": {
                            "first_name": "John",
                            "last_name": "Doe",
                            "email": "john@example.com",
                        },
                    }
                }
            },
        },
        404: {
            "description": "Invitation not found",
            "content": {"application/json": {"example": {"detail": "Invitation not found"}}},
        },
        410: {
            "description": "Invitation expired or revoked",
            "content": {
                "application/json": {
                    "examples": {
                        "expired": {"value": {"detail": "Invitation has expired"}},
                        "revoked": {"value": {"detail": "Invitation has been revoked"}},
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
async def get_invitation_by_token(
    token: str,
) -> models_invitations.InvitationsDetailResponse:
    return await service_invitations.get_invitation_by_token(token)


@router.patch(
    "/invitations",
    response_model=dict[UUID, models_invitations.InvitationsReadDB],
    summary="Patch multiple invitations using JSON Patch operations",
    description=(
        "Apply JSON Patch operations to multiple invitations. Each operation is applied to a "
        "specific invitation identified by UUID. Returns a dictionary mapping invitation IDs "
        "to their updated Invitation models.\n\n"
        "JSON Patch operations supported:\n"
        "- `replace`: Replace a field value\n\n"
        "Patchable fields:\n"
        "- `status`: Change invitation status (Active, Expired, Revoked)\n"
        "- `expires_at`: Update expiration date/time\n\n"
        "Example request body:\n"
        "```json\n"
        "{\n"
        '  "patch": {\n'
        '    "550e8400-e29b-41d4-a716-446655440000": {\n'
        '      "op": "replace",\n'
        '      "path": "/status",\n'
        '      "value": "Revoked"\n'
        "    }\n"
        "  }\n"
        "}\n"
        "```"
    ),
    tags=["Invitations"],
    responses={
        200: {"description": "Invitations patched successfully"},
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
                            "value": {
                                "detail": "Invalid path: /event_id. "
                                "Allowed fields: status, expires_at"
                            },
                        },
                        "InvalidValue": {
                            "summary": "Invalid field value",
                            "value": {
                                "detail": "Invalid status: InvalidStatus. "
                                "Must be one of: Active, Expired, Revoked"
                            },
                        },
                    }
                }
            },
        },
        404: {
            "description": "One or more invitations not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invitation 550e8400-e29b-41d4-a716-446655440000 not found"
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
async def patch_invitations(
    request: models_patch.PatchRequest,
) -> dict[UUID, models_invitations.InvitationsReadDB]:
    return await service_invitations.patch_invitations_service(request)
