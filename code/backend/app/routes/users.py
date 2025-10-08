from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models import patch as models_patch
from app.models import users as models_users
from app.service.users import create_user_service

router = APIRouter()


@router.post(
    "/users",
    response_model=models_users.UserRead,
    summary="Create a new user",
    description="Create a new user with the provided information. Email must be unique.",
    tags=["Users"],
    status_code=200,
    responses={
        200: {
            "description": "User created successfully",
            "model": models_users.UserRead
        },
        400: {
            "description": "Invalid input or duplicate email",
            "content": {
                "application/json": {
                    "example": {"detail": "A user with this email already exists"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Internal server error"}
                }
            }
        }
    }
)
async def create_user(user: models_users.UserCreate) -> models_users.UserRead:
    """
    Create a new user with the following requirements:
    - Unique email address
    - Valid first and last names
    - Optional favorite color
    """
    return await create_user_service(user)


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


@router.get(
    "/users",
    response_model=list[models_users.UserRead],
    summary="Get a list of users",
    description=(
        "Get users with optional filters. All filters are optional and can be combined."
    ),
    tags=["Users"],
)
async def list_users(
    user_id: UUID | None = None,
    email: str | None = None,
) -> list[models_users.UserRead]:
    """Get a list of users with optional filters:
    - user_id: Filter by specific user ID
    - email: Filter by specific email
    """
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "/users/{user_id}",
    response_model=models_users.UserRead,
    summary="Delete an user by the user id",
    tags=["Users"],
)
async def delete_user(user_id: UUID) -> models_users.UserRead:
    raise HTTPException(status_code=501, detail="Not implemented")
