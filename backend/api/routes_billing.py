"""Stripe billing endpoints: Checkout, Customer Portal, and webhook receiver."""

import logging
import os
from datetime import datetime, timezone
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

import stripe_client  # noqa: F401 — module-level init sets stripe.api_key

from api.deps import get_db, current_user_id
from db.models import Profile

logger = logging.getLogger(__name__)

router = APIRouter()

PRICE_TO_TIER = {
    os.environ.get("STRIPE_PRICE_MONTHLY", ""): "premium_monthly",
    os.environ.get("STRIPE_PRICE_YEARLY", ""): "premium_yearly",
}


class CheckoutRequest(BaseModel):
    tier: str  # "monthly" | "yearly"


class EntitlementResponse(BaseModel):
    tier: str | None
    status: str | None
    is_premium: bool
    cancel_at_period_end: bool


# ── Authenticated endpoints ──────────────────────────────────────────────


@router.get("/billing/entitlement", response_model=EntitlementResponse)
def get_entitlement(
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        return EntitlementResponse(
            tier=None, status=None, is_premium=False, cancel_at_period_end=False,
        )
    is_premium = (
        profile.subscription_status == "active"
        and profile.subscription_tier in PRICE_TO_TIER.values()
    )
    return EntitlementResponse(
        tier=profile.subscription_tier,
        status=profile.subscription_status,
        is_premium=is_premium,
        cancel_at_period_end=profile.subscription_cancel_at_period_end,
    )


@router.post("/billing/checkout")
def create_checkout_session(
    body: CheckoutRequest,
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == user_id).one()

    if not profile.stripe_customer_id:
        customer = stripe.Customer.create(
            email=profile.email,
            metadata={"user_id": str(user_id)},
        )
        profile.stripe_customer_id = customer.id
        db.commit()

    price_id = (
        os.environ["STRIPE_PRICE_MONTHLY"]
        if body.tier == "monthly"
        else os.environ["STRIPE_PRICE_YEARLY"]
    )

    session = stripe.checkout.Session.create(
        customer=profile.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{os.environ['FRONTEND_URL']}/billing/success",
        cancel_url=f"{os.environ['FRONTEND_URL']}/billing/cancel",
        allow_promotion_codes=False,
    )
    return {"url": session.url}


@router.post("/billing/portal")
def create_portal_session(
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == user_id).one()

    if not profile.stripe_customer_id:
        raise HTTPException(400, "No subscription to manage")

    session = stripe.billing_portal.Session.create(
        customer=profile.stripe_customer_id,
        return_url=os.environ["FRONTEND_URL"],
    )
    return {"url": session.url}


# ── Webhook (unauthenticated — security via signature verification) ──────


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.environ["STRIPE_WEBHOOK_SECRET"]
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(400, "Invalid signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    logger.info("Stripe event received: %s (id=%s)", event_type, event.get("id"))

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data_object, db)
    elif event_type in ("customer.subscription.created", "customer.subscription.updated"):
        _handle_subscription_change(data_object, db)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_canceled(data_object, db)
    elif event_type == "invoice.payment_failed":
        logger.warning("Payment failed for customer %s", data_object.get("customer"))

    return {"received": True}


# ── Webhook handlers ─────────────────────────────────────────────────────


def _get_profile_by_customer(customer_id: str, db: Session) -> Profile | None:
    return db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()


def _handle_checkout_completed(session_obj: dict, db: Session):
    customer_id = session_obj.get("customer")
    if not customer_id:
        logger.warning("checkout.session.completed missing customer ID")
        return

    profile = _get_profile_by_customer(customer_id, db)
    if not profile:
        logger.warning("No profile found for Stripe customer %s", customer_id)
        return

    logger.info("Checkout completed for profile %s", profile.id)


def _handle_subscription_change(subscription: dict, db: Session):
    customer_id = subscription.get("customer")
    if not customer_id:
        logger.warning("subscription event missing customer ID")
        return

    profile = _get_profile_by_customer(customer_id, db)
    if not profile:
        logger.warning("No profile found for Stripe customer %s", customer_id)
        return

    profile.subscription_status = subscription.get("status")

    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
        profile.subscription_tier = PRICE_TO_TIER.get(price_id)
        if not profile.subscription_tier:
            logger.warning("Unknown price ID %s — tier set to None", price_id)

    period_end = subscription.get("current_period_end")
    if period_end:
        profile.subscription_current_period_end = datetime.fromtimestamp(
            period_end, tz=timezone.utc
        )

    profile.subscription_cancel_at_period_end = subscription.get(
        "cancel_at_period_end", False
    )

    db.commit()
    logger.info(
        "Subscription updated for profile %s: status=%s tier=%s",
        profile.id, profile.subscription_status, profile.subscription_tier,
    )


def _handle_subscription_canceled(subscription: dict, db: Session):
    customer_id = subscription.get("customer")
    if not customer_id:
        return

    profile = _get_profile_by_customer(customer_id, db)
    if not profile:
        logger.warning("No profile found for Stripe customer %s", customer_id)
        return

    profile.subscription_status = "canceled"
    profile.subscription_tier = None
    profile.subscription_cancel_at_period_end = False
    db.commit()
    logger.info("Subscription canceled for profile %s", profile.id)
