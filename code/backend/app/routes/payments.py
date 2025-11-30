"""
AI-generated code: 80%

Human code: 20%

Framework-generated code: 0%
"""

from fastapi import APIRouter, Request
from starlette.responses import JSONResponse

from app.models.payments import (
    CheckoutRequest,
    CheckoutResponse,
    RefundRequest,
    RefundResponse,
)
from app.service.stripe_service import (
    create_checkout_session_for_payment,
    refund_payment_for_event_user,
    process_webhook_event,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


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
async def create_session(data: CheckoutRequest) -> CheckoutResponse:
    """
    Thin HTTP wrapper for the payment flow:
    - delegates to stripe_service.create_checkout_session_for_payment
    - lets the service raise HTTPException on Stripe / internal errors
    """
    return await create_checkout_session_for_payment(data)


@router.post(
    "/refund",
    response_model=RefundResponse,
    summary="Refund latest successful payment for an event/user",
    description=(
        "Finds the most recent successful payment for the given event and user, "
        "and issues a Stripe refund if it has not already been refunded."
    ),
)
async def refund_payment(data: RefundRequest) -> RefundResponse:
    return await refund_payment_for_event_user(data)


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
