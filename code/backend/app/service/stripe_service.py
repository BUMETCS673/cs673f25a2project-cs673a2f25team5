"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

import logging

import stripe
from fastapi import HTTPException

import app.db.payments as payments_db
from app.config import settings
from app.models.payments import PaymentStatus

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


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
    except stripe.error.StripeError as e:
        logger.error("Stripe error: %s", str(e))
        raise


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

    # Handle  Validation
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
