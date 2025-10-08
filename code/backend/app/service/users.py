import logging
from fastapi import HTTPException

from app.db.users import create_user_db, get_user_by_email_db
from app.models.users import UserCreate, UserRead

logger = logging.getLogger(__name__)


async def create_user_service(user: UserCreate) -> UserRead:
    """
    Create a new user with business logic validation.
    
    Validates:
    - Email uniqueness
    - Data sanitization
    """
    try:
        existing_user = await get_user_by_email_db(user.email)
        if existing_user:
            logger.warning(f"Attempted to create duplicate user with email: {user.email}")
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists"
            )

        sanitized_user = UserCreate(
            first_name=user.first_name.strip(),
            last_name=user.last_name.strip(),
            email=user.email.strip().lower(),
            date_of_birth=user.date_of_birth,
            color=user.color.strip() if user.color else None
        )

        return await create_user_db(sanitized_user)
        
    except HTTPException:
        # Let HTTP exceptions pass through unchanged
        raise
    except ValueError as e:
        logger.error(f"Database error while creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error while creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
