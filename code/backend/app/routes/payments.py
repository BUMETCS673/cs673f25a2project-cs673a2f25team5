"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

from decimal import ROUND_HALF_UP, Decimal

import stripe
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import JSONResponse

import app.db.payments as payments_db
from app.config import settings
from app.models.payments import CheckoutRequest, CheckoutResponse, PaymentCreate, PaymentStatus
from app.service.stripe_service import create_checkout_session, process_webhook_event

router = APIRouter(prefix="/payments", tags=["Payments"])


# ---- helpers ----
# Stripe expects amounts in the smallest currency unit (e.g. cents).
# For USD $25.00 becomes 2500 cents.
# The helper in code handles this conversion automatically.
def usd_to_cents(amount_usd: Decimal) -> int:
    # 10.00 -> 1000; exact rounding
    return int((amount_usd * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


# ---- endpoints ----
@router.post(
    "/checkout-session",
    response_model=CheckoutResponse,
    summary="Create Stripe Checkout session (USD)",
    description=(
        "Creates a Stripe Checkout Session for an event payment.\n\n"
        "Flow:\n"
        "1. A new payment record is created in the database with status 'created'.\n"
        "2. A Stripe Checkout Session is generated for the given event and user.\n"
        "3. The Stripe Checkout Session ID is stored on the payment record.\n"
        "4. The checkout URL is returned so the user can be redirected to Stripe.\n\n"
        "After the user completes payment, the `/payments/webhook` endpoint will receive "
        "Stripe events and update the payment status to 'succeeded', 'failed', or "
        "'canceled' accordingly."
    ),
    responses={
        200: {
            "description": "Checkout session created successfully.",
            "model": CheckoutResponse,
        },
        400: {
            "description": "Invalid request or Stripe API error.",
        },
        404: {
            "description": "Event or user not found.",
        },
        500: {
            "description": "Unexpected internal server error.",
        },
    },
)
async def create_session(data: CheckoutRequest) -> JSONResponse:
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

        # You can return a model instance or dict; both work with response_model
        return CheckoutResponse(checkout_url=session.url)

    except stripe.error.InvalidRequestError as err:
        # Bad parameters sent to Stripe (amount, currency, etc.)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Stripe request: {getattr(err, 'user_message', None) or str(err)}",
        ) from err

    except stripe.error.AuthenticationError as err:
        # Misconfigured API key / Stripe account
        raise HTTPException(
            status_code=500,
            detail="Stripe authentication failed. Check STRIPE_SECRET_KEY.",
        ) from err

    except stripe.error.StripeError as err:
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


@router.post(
    "/webhook",
    summary="Stripe webhook (signature verified)",
    description=(
        "Receives events from Stripe such as `checkout.session.completed` and "
        "`payment_intent.payment_failed`.\n\n"
        "The request signature is verified using the Stripe webhook secret. For a "
        "`checkout.session.completed` event, the corresponding payment record is "
        "updated to status 'succeeded' and the Stripe Checkout Session / Payment "
        "Intent IDs are stored.\n\n"
        "This endpoint should be configured as the webhook URL in Stripe (or via the "
        "Stripe CLI during local development)."
    ),
    responses={
        200: {
            "description": "Webhook processed successfully. Stripe will not retry.",
        },
        400: {
            "description": "Invalid payload or event type not handled.",
        },
        401: {
            "description": "Invalid Stripe signature. Event not trusted.",
        },
        500: {
            "description": "Unexpected internal error while processing the event.",
        },
    },
)
async def stripe_webhook(request: Request) -> JSONResponse:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    result = await process_webhook_event(payload, sig_header)
    return JSONResponse(result)
