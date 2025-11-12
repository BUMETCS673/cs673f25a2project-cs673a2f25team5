"""
Stripe API interactions (USD-only).
"""

import logging

import stripe

from app.config import STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)
stripe.api_key = STRIPE_SECRET_KEY


def create_checkout_session(
    *,
    amount_cents: int,
    event_id: str,
    user_id: str,
    success_url: str,
    cancel_url: str,
    customer_email: str | None = None,
):
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
