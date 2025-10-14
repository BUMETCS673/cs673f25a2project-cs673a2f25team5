from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.models import patch as models_patch
from app.models import users as models_users
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
        "Multiple filters can be combined using multiple filter parameters.\n\n"
        "Available operators: eq, neq, gt, gte, lt, lte, like, ilike\n\n"
        "Pagination is supported via offset and limit parameters.\n\n"
        "Examples:\n"
        "- `/users?filter=email:eq:john@example.com`\n"
        "- `/users?filter=created_at:gt:2023-01-01&filter=first_name:ilike:John%`\n"
        "- `/users?offset=20&limit=10` (get third page of 10 users)"
    ),
    tags=["Users"],
    responses={
        200: {"description": "Paginated list of users"},
        400: {
            "description": "Invalid parameters",
            "content": {
                "application/json": {
                    "examples": {
                        "InvalidFilterFormat": {
                            "summary": "Invalid filter format",
                            "value": {"detail": "Invalid filter format"},
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
async def list_users(
    filter: list[str] | None = FILTER_QUERY,
    offset: int = OFFSET_QUERY,
    limit: int = LIMIT_QUERY,
) -> models_users.PaginatedUsers:
    """
    Get a paginated list of users with optional filters.

    Filter format: field:operator:value
    Examples:
    - field:eq:value (equals)
    - field:gt:value (greater than)
    - field:ilike:value (case-insensitive pattern match)

    Pagination:
    - offset: Number of records to skip (default: 0)
    - limit: Maximum number of records to return (default: 100, max: 1000)
    """
    try:
        return await users_service.get_users_service(filter, offset, limit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post(
    "/users",
    response_model=models_users.UserRead,
    summary="Create a new user",
    description="Create a new user with the provided information. Email must be unique.",
    tags=["Users"],
    status_code=201,
    responses={
        201: {"description": "User created successfully"},
        400: {
            "description": "Invalid input or duplicate email",
            "content": {
                "application/json": {
                    "example": {"detail": "A user with this email already exists"}
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def create_user(user: models_users.UserCreate) -> models_users.UserRead:
    """
    Create a new user with the following requirements:
    - Unique email address
    - Valid first and last names
    - Optional favorite color
    """
    return await users_service.create_user_service(user)


@router.patch(
    "/users",
    response_model=models_patch.PatchRequest,
    summary="Patch users using JSON Patch",
    tags=["Users"],
)
async def patch_users(
    request: models_patch.PatchRequest,
) -> models_users.UserRead:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "/users/{user_id}",
    response_model=models_users.UserRead,
    summary="Delete a user by the user id",
    tags=["Users"],
    status_code=200,
    responses={
        200: {"description": "User deleted successfully"},
        400: {
            "description": "Invalid input",
            "content": {"application/json": {"example": {"detail": "Invalid user ID"}}},
        },
        404: {
            "description": "User not found",
            "content": {"application/json": {"example": {"detail": "User not found"}}},
        },
        500: {
            "description": "Internal server error",
            "content": {"application/json": {"example": {"detail": "Internal server error"}}},
        },
    },
)
async def delete_user(user_id: UUID) -> models_users.UserRead:
    return await users_service.delete_user_service(user_id)
