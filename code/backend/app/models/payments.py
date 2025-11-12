from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    created = "created"
    processing = "processing"
    succeeded = "succeeded"
    failed = "failed"
    canceled = "canceled"


class PaymentCreate(BaseModel):
    event_id: UUID
    user_id: UUID
    amount_usd: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    currency: str = "usd"
    stripe_checkout_session_id: str | None = None
    stripe_payment_intent_id: str | None = None
    status: PaymentStatus = PaymentStatus.created


class PaymentRead(PaymentCreate):
    payment_id: UUID
    created_at: datetime
    updated_at: datetime
