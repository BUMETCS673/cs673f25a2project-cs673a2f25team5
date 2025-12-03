"""
AI-generated code: 70%

Human code: 30%

Framework-generated code: 0%
"""

from uuid import UUID

from fastapi import APIRouter, Query

from app.models import patch as models_patch
from app.models import users as models_users
from app.routes.shared_responses import (
    RESPONSES_CREATE,
    RESPONSES_DELETE,
    RESPONSES_LIST,
    RESPONSES_PATCH,
)
from app.service import users as users_service

router = APIRouter()


FILTER_QUERY = Query(
    None,
    description="Filter in the format field:operator:value. Can be used multiple times.",
    examples=["email:eq:john@example.com", "first_name:ilike:John%"],
)
OFFSET_QUERY = Query(0, ge=0, description="Number of records to skip")
LIMIT_QUERY = Query(100, ge=1, le=1000, description="Maximum number of users to return")


@router.get(
    "/users",
    response_model=models_users.PaginatedUsers,
    summary="Get a paginated list of users",
    description=(
        "Get users with optional filters using the format `field:operator:value`. "
        "Multiple filters can be combined using multiple filter_expression parameters.\n\n"
        "Available operators: eq, neq, gt, gte, lt, lte, like, ilike\n\n"
        "Pagination is supported via offset and limit parameters.\n\n"
        "Examples:\n"
        "- `/users?filter_expression=email:eq:john@example.com`\n"
        "- `/users?offset=20&limit=10` (get third page of 10 users)"
    ),
    tags=["Users"],
    responses=RESPONSES_LIST,
)
async def list_users(
    filter_expression: list[str] | None = FILTER_QUERY,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
) -> models_users.PaginatedUsers:
    return await users_service.get_users_service(filter_expression, offset, limit)


@router.post(
    "/users",
    response_model=models_users.UserRead,
    summary="Create a new user",
    description="Create a new user with the provided information. Email must be unique.",
    tags=["Users"],
    status_code=201,
    responses=RESPONSES_CREATE,
)
async def create_user(user: models_users.UserCreate) -> models_users.UserRead:
    return await users_service.create_user_service(user)


@router.patch(
    "/users",
    response_model=dict[UUID, models_users.UserRead],
    summary="Patch multiple users using JSON Patch operations",
    description=(
        "Apply JSON Patch operations to multiple users. Each operation is applied to a "
        "specific user identified by UUID. Returns a dictionary mapping user IDs to their "
        "updated User models.\n\n"
        "JSON Patch operations supported:\n"
        "- `replace`: Replace a field value\n"
        "Example request body:\n"
        "```json\n"
        "{\n"
        '  "patch": {\n'
        '    "550e8400-e29b-41d4-a716-446655440000": {\n'
        '      "op": "replace",\n'
        '      "path": "/first_name",\n'
        '      "value": "John"\n'
        "    }\n"
        "  }\n"
        "}\n"
        "```"
    ),
    tags=["Users"],
    responses=RESPONSES_PATCH,
)
async def patch_users(
    request: models_patch.PatchRequest,
) -> dict[UUID, models_users.UserRead]:
    return await users_service.patch_users_service(request)


@router.delete(
    "/users/{user_id}",
    response_model=models_users.UserRead,
    summary="Delete a user by the user id",
    tags=["Users"],
    status_code=200,
    responses=RESPONSES_DELETE,
)
async def delete_user(user_id: UUID) -> models_users.UserRead:
    return await users_service.delete_user_service(user_id)
