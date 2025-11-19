"""
AI-generated code: 50%

Human code: 50%

Framework-generated code: 0%
"""

from uuid import UUID

from fastapi import APIRouter, Query

from app.models import invitations as models_invitations
from app.models import patch as models_patch
from app.routes.shared_responses import (
    RESPONSES_CREATE,
    RESPONSES_GET_BY_ID,
    RESPONSES_LIST,
    RESPONSES_PATCH,
)
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
    responses=RESPONSES_LIST,
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
    responses=RESPONSES_CREATE,
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
    responses=RESPONSES_GET_BY_ID,
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
    responses=RESPONSES_PATCH,
)
async def patch_invitations(
    request: models_patch.PatchRequest,
) -> dict[UUID, models_invitations.InvitationsReadDB]:
    return await service_invitations.patch_invitations_service(request)
