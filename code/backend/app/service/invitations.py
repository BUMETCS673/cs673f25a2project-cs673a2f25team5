"""
AI-generated code: 90%

Human code: 10%

Framework-generated code: 0%
"""

import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException

import app.db.events as events_db
import app.db.invitations as db_invitations
import app.db.users as users_db
from app.config import settings
from app.db.filters import FilterOperation
from app.models.events import EventBase
from app.models.invitations import (
    InvitationsBase,
    InvitationsCreate,
    InvitationsDetailResponse,
    InvitationsRead,
    InvitationsReadDB,
    InvitationStatus,
    PaginatedInvitations,
)
from app.models.patch import PatchRequest
from app.models.users import UserBase
from app.service import token_helpers
from app.service.exception_handler import handle_service_exceptions
from app.service.filter_helper import parse_filter

logger = logging.getLogger(__name__)


async def check_and_expire_invitation(invitation: InvitationsReadDB) -> InvitationsReadDB:
    if invitation.status != InvitationStatus.ACTIVE.value:
        return invitation

    if invitation.expires_at:
        now = datetime.now(UTC)

        expiration_datetime = invitation.expires_at
        if expiration_datetime.tzinfo is None:
            expiration_datetime = expiration_datetime.replace(tzinfo=UTC)

        if expiration_datetime < now:
            logger.info(
                f"Auto-expiring invitation {invitation.invitation_id} "
                f"(expires_at: {expiration_datetime})"
            )
            updates = {invitation.invitation_id: {"status": InvitationStatus.EXPIRED.value}}
            updated_invitations = await db_invitations.batch_update_invitations_db(updates)
            return updated_invitations[invitation.invitation_id]

    return invitation


@handle_service_exceptions
async def get_invitations_service(
    filter_expression: list[str] | None = None, offset: int = 0, limit: int = 100
) -> PaginatedInvitations:
    filters = [parse_filter(f) for f in (filter_expression or [])]

    invitations, total = await db_invitations.get_invitations_db(filters, offset, limit)

    updated_invitations: list[InvitationsReadDB] = []
    for invitation in invitations:
        updated_invitation = await check_and_expire_invitation(invitation)
        updated_invitations.append(updated_invitation)

    return PaginatedInvitations(
        items=updated_invitations, total=total, offset=offset, limit=limit
    )


@handle_service_exceptions
async def create_invitation(invitation: InvitationsCreate) -> InvitationsRead:
    await UserBase.validate_user_exists(invitation.user_id)
    await EventBase.validate_event_exists(invitation.event_id)

    filters = [
        FilterOperation("event_id", "eq", invitation.event_id),
        FilterOperation("user_id", "eq", invitation.user_id),
        FilterOperation("status", "eq", InvitationStatus.ACTIVE.value),
    ]
    existing_invitations, _ = await db_invitations.get_invitations_db(filters, limit=1)

    if existing_invitations:
        logger.info(
            f"Active invitation already exists for user {invitation.user_id} "
            f"and event {invitation.event_id}"
        )
        raise HTTPException(
            status_code=409,
            detail="An active invitation already exists for this event",
        )

    token = token_helpers.generate_token()
    token_hash = token_helpers.hash_token(token)

    new_invitation = await db_invitations.create_invitation_db(invitation, token_hash)

    invitation_dict = new_invitation.model_dump()
    invitation_dict["token"] = token
    invitation_dict["invitation_link"] = f"{settings.FRONTEND_URL}/invite/{token}"

    return InvitationsRead.model_validate(invitation_dict)


@handle_service_exceptions
async def get_invitation_by_token(token: str) -> InvitationsDetailResponse:
    token_hash = token_helpers.hash_token(token)
    filters = [FilterOperation("token_hash", "eq", token_hash)]
    invitations_list, _ = await db_invitations.get_invitations_db(filters, limit=1)

    if not invitations_list:
        logger.info("Invitation not found for token hash")
        raise HTTPException(status_code=404, detail="Invitation not found")

    invitation = invitations_list[0]

    invitation = await check_and_expire_invitation(invitation)
    if invitation.status == InvitationStatus.REVOKED.value:
        logger.info(f"Invitation {invitation.invitation_id} has been revoked")
        raise HTTPException(status_code=410, detail="Invitation has been revoked")

    if invitation.status == InvitationStatus.EXPIRED.value:
        logger.info(f"Invitation {invitation.invitation_id} has expired")
        raise HTTPException(status_code=410, detail="Invitation has expired")

    event_filters = [FilterOperation("event_id", "eq", invitation.event_id)]
    events, _ = await events_db.get_events_db(event_filters, limit=1)

    if not events:
        logger.error(f"Event {invitation.event_id} not found for invitation")
        raise HTTPException(status_code=404, detail="Event not found")

    user_filters = [FilterOperation("user_id", "eq", invitation.user_id)]
    users, _ = await users_db.get_users_db(user_filters, limit=1)

    if not users:
        logger.error(f"User {invitation.user_id} not found for invitation")
        raise HTTPException(status_code=404, detail="User not found")

    response_data = invitation.model_dump()
    response_data["event"] = events[0]
    response_data["user"] = users[0]

    return InvitationsDetailResponse.model_validate(response_data)


@handle_service_exceptions
async def patch_invitations_service(
    request: PatchRequest,
) -> dict[UUID, InvitationsReadDB]:
    updates = await InvitationsBase.validate_patch_operations(request.patch)

    result = await db_invitations.batch_update_invitations_db(updates)

    logger.info(f"Successfully updated {len(result)} invitations in batch operation")
    return result
