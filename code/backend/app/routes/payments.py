from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from starlette.responses import JSONResponse

import app.db.payments as payments_db
from app.config import FRONTEND_BASE_URL, STRIPE_WEBHOOK_SECRET
from app.models.payments import PaymentCreate, PaymentStatus
from app.service.stripe_service import create_checkout_session

router = APIRouter(prefix="/payments", tags=["Payments"])


# ---- helpers ----
# Stripe expects amounts in the smallest currency unit (e.g. cents).
# For USD $25.00 becomes 2500 cents.
# The helper in code handles this conversion automatically.
def usd_to_cents(amount_usd: Decimal) -> int:
    # 10.00 -> 1000; exact rounding
    return int((amount_usd * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


# ---- schemas ----
class CheckoutRequest(BaseModel):
    event_id: UUID
    user_id: UUID
    amount_usd: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    email: str | None = None


class CheckoutResponse(BaseModel):
    checkout_url: str


# ---- endpoints ----
@router.post(
    "/checkout-session",
    response_model=CheckoutResponse,
    summary="Create Stripe Checkout session (USD)",
)
async def create_session(data: CheckoutRequest):
    # 1) Create a pending/processing payment record
    pending = await payments_db.create_payment_db(
        PaymentCreate(
            event_id=data.event_id,
            user_id=data.user_id,
            amount_usd=data.amount_usd,
            currency="usd",
            status=PaymentStatus.processing,
        )
    )

    # 2) Build redirect URLs
    success_url = f"{FRONTEND_BASE_URL}/payment/success?payment_id={pending.payment_id}"
    cancel_url = f"{FRONTEND_BASE_URL}/payment/cancel?payment_id={pending.payment_id}"

    # 3) Create stripe session (convert dollars -> cents)
    try:
        session = create_checkout_session(
            amount_cents=usd_to_cents(data.amount_usd),
            event_id=str(data.event_id),
            user_id=str(data.user_id),
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=data.email,
        )
        await payments_db.set_checkout_id(pending.payment_id, session.id)
        return {"checkout_url": session.url}
    except Exception as err:
        # Optional: set status to failed here
        raise HTTPException(status_code=400, detail=str(err)) from err


@router.post("/webhook", summary="Stripe webhook (signature verified)")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError as err:
        raise HTTPException(status_code=400, detail="Invalid signature") from err
    except Exception as err:
        raise HTTPException(status_code=400, detail="Invalid payload") from err

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await payments_db.set_status_by_checkout_session(
            checkout_id=session["id"],
            status=PaymentStatus.succeeded,
            payment_intent_id=session.get("payment_intent"),
        )
        # (optional) auto-register attendee here using session["metadata"] (event_id, user_id)

    elif event["type"] in ("payment_intent.payment_failed", "checkout.session.expired"):
        obj = event["data"]["object"]
        _pi_id = obj.get("id") or obj.get("payment_intent")
        # We only saved by checkout_id; nothing to do unless you extend DB update by pi_id

    return JSONResponse({"received": True})
