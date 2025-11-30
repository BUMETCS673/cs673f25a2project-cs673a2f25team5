"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging
from decimal import ROUND_HALF_UP, Decimal

import stripe
from fastapi import HTTPException
from stripe import error as stripe_error

import app.db.payments as payments_db
from app.config import settings
from app.models.payments import (
    CheckoutRequest,
    CheckoutResponse,
    PaymentCreate,
    PaymentStatus,
    RefundRequest,
    RefundResponse,
)

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


# ---- helpers ----
# Stripe expects amounts in the smallest currency unit (e.g. cents).
# For USD $25.00 becomes 2500 cents.
# The helper in code handles this conversion automatically.
def usd_to_cents(amount_usd: Decimal) -> int:
    # 10.00 -> 1000; exact rounding
    return int((amount_usd * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


# low-level helper: ONLY Stripe SDK call
def create_checkout_session(
    *,
    amount_cents: int,
    event_id: str,
    user_id: str,
    success_url: str,
    cancel_url: str,
    customer_email: str | None = None,
) -> stripe.checkout.Session:
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": f"Event #{event_id} Registration"},
                        "unit_amount": amount_cents,  # integer cents
                    },
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=customer_email,
            metadata={"event_id": str(event_id), "user_id": str(user_id)},
        )
        logger.info("Stripe checkout session created: %s", session.id)
        return session
    except stripe_error.StripeError as e:
        logger.error("Stripe error: %s", str(e))
        raise


# high-level: our app's payment flow, main "service" API
async def create_checkout_session_for_payment(data: CheckoutRequest) -> CheckoutResponse:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured. Set STRIPE_SECRET_KEY.",
        )

    # Reuse existing successful payment that has not been refunded
    existing = await payments_db.get_latest_payment_for_event_user(
        event_id=data.event_id,
        user_id=data.user_id,
        statuses=(PaymentStatus.succeeded,),
    )
    if (
        existing
        and existing.status == PaymentStatus.succeeded
        and existing.stripe_refund_id is None
    ):
        return CheckoutResponse(checkout_url=None, already_paid=True)

    # 1) Create an initial payment record in 'created' state
    pending = await payments_db.create_payment_db(
        PaymentCreate(
            event_id=data.event_id,
            user_id=data.user_id,
            amount_usd=data.amount_usd,
            currency="usd",
            status=PaymentStatus.created,
        )
    )

    # 2) Build redirect URLs using the payment_id
    success_url = (
        f"{settings.FRONTEND_BASE_URL}/payment/success?payment_id={pending.payment_id}"
    )
    cancel_url = f"{settings.FRONTEND_BASE_URL}/payment/cancel?payment_id={pending.payment_id}"

    # 3) Create Stripe Checkout Session (convert dollars -> cents)
    try:
        session = create_checkout_session(
            amount_cents=usd_to_cents(data.amount_usd),
            event_id=str(data.event_id),
            user_id=str(data.user_id),
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=data.email,
        )

        # 4) Save the Stripe checkout session ID on our payment record
        await payments_db.set_checkout_id(pending.payment_id, session.id)

        # Return a model instance or dict; both work with response_model
        return CheckoutResponse(checkout_url=session.url)

    except stripe_error.InvalidRequestError as err:
        # Bad parameters sent to Stripe (amount, currency, etc.)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Stripe request: {getattr(err, 'user_message', None) or str(err)}",
        ) from err

    except stripe_error.AuthenticationError as err:
        # Misconfigured API key / Stripe account
        raise HTTPException(
            status_code=500,
            detail="Stripe authentication failed. Check STRIPE_SECRET_KEY.",
        ) from err

    except stripe_error.StripeError as err:
        # Generic Stripe error (network, rate limit, etc.)
        raise HTTPException(
            status_code=400,
            detail=f"Stripe error: {getattr(err, 'user_message', None) or str(err)}",
        ) from err

    except Exception as err:
        # Any unexpected error in the code
        raise HTTPException(
            status_code=500,
            detail="Unexpected payment processing error.",
        ) from err


async def process_webhook_event(payload: bytes, sig_header: str | None) -> dict:
    """
    Handles Stripe webhook events. Verifies the signature and updates payment state.
    """
    # 1) Verify Stripe signature and parse event
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError as err:
        raise HTTPException(status_code=400, detail="Invalid signature") from err
    except Exception as err:
        raise HTTPException(status_code=400, detail="Invalid payload") from err

    # Handle event Validation
    event_type = event.get("type")
    data = event.get("data") or {}
    obj = data.get("object")

    if not event_type or obj is None:
        logger.warning("Received Stripe event without expected data/object: %s", event)
        return {"received": True}

    # 2) Handle successful checkout session
    if event_type == "checkout.session.completed":
        await payments_db.set_status_by_checkout_session(
            checkout_id=obj["id"],
            status=PaymentStatus.succeeded,
            payment_intent_id=obj.get("payment_intent"),
        )
        # (optional) auto-register attendee using obj["metadata"] (event_id, user_id)

    # 3) Optional: handle failed/expired cases
    elif event_type in ("payment_intent.payment_failed", "checkout.session.expired"):
        _pi_id = obj.get("id") or obj.get("payment_intent")  # placeholder for future extension
        # Currently we only save by checkout_id; extend DB updates here if needed.

    # 4) Acknowledge event so Stripe doesn't retry
    return {"received": True}


async def refund_payment_for_event_user(data: RefundRequest) -> RefundResponse:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured. Set STRIPE_SECRET_KEY.",
        )

    latest = await payments_db.get_latest_payment_for_event_user(
        event_id=data.event_id,
        user_id=data.user_id,
        statuses=(PaymentStatus.succeeded, PaymentStatus.refunded),
    )

    if latest is None:
        return RefundResponse(status="no_payment")

    if latest.status == PaymentStatus.refunded or latest.stripe_refund_id:
        return RefundResponse(status="already_refunded", refund_id=latest.stripe_refund_id)

    # Need payment_intent to refund
    payment_intent_id = latest.stripe_payment_intent_id
    if not payment_intent_id and latest.stripe_checkout_session_id:
        session = stripe.checkout.Session.retrieve(latest.stripe_checkout_session_id)
        payment_intent_id = session.get("payment_intent")

    if not payment_intent_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot refund payment without a payment_intent_id",
        )

    try:
        refund = stripe.Refund.create(payment_intent=payment_intent_id)
        await payments_db.set_status_by_payment_id(
            latest.payment_id,
            status=PaymentStatus.refunded,
            stripe_refund_id=refund.id,
        )
        return RefundResponse(status="refunded", refund_id=refund.id)
    except stripe_error.InvalidRequestError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except stripe_error.AuthenticationError as err:
        raise HTTPException(
            status_code=500,
            detail="Stripe authentication failed. Check STRIPE_SECRET_KEY.",
        ) from err
    except stripe_error.StripeError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=500, detail="Unexpected refund error.") from err
