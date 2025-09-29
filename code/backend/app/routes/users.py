from fastapi import APIRouter, HTTPException
from uuid import UUID

from app.models import users as models_users
from app.models import patch as models_patch

router = APIRouter()


@router.post(
    "/users",
    response_model=models_users.UserRead,
    summary="Create an user",
    tags=["Users"],
)
async def create_user(user: models_users.UserCreate) -> models_users.UserRead:
    raise HTTPException(status_code=501, detail="Not implemented")


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
    tags=["Users"],
)
async def list_users() -> list[models_users.UserRead]:
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete(
    "/users/{user_id}",
    response_model=models_users.UserRead,
    summary="Delete an user by the user id",
    tags=["Users"],
)
async def delete_user(user_id: UUID) -> models_users.UserRead:
    raise HTTPException(status_code=501, detail="Not implemented")
