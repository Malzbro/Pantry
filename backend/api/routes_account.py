"""Account endpoints: GDPR data export and deletion."""

import logging
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

import stripe_client  # noqa: F401

from api.deps import get_db, current_user_id
from db.models import (
    Profile, Household, HouseholdMember, Plan, PlanMeal, PushSubscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["account"])


@router.get("/account/export")
def export_data(
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()

    profile_data = None
    if profile:
        profile_data = {
            "id": str(profile.id),
            "display_name": profile.display_name,
            "email": profile.email,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
            "subscription_status": profile.subscription_status,
            "subscription_tier": profile.subscription_tier,
            "subscription_current_period_end": (
                profile.subscription_current_period_end.isoformat()
                if profile.subscription_current_period_end
                else None
            ),
            "subscription_cancel_at_period_end": profile.subscription_cancel_at_period_end,
        }

    memberships = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.user_id == user_id)
        .all()
    )
    household_ids = [m.household_id for m in memberships]

    households_data = []
    if household_ids:
        households = (
            db.query(Household)
            .filter(Household.id.in_(household_ids))
            .all()
        )
        for h in households:
            membership = next(m for m in memberships if m.household_id == h.id)
            households_data.append({
                "id": str(h.id),
                "name": h.name,
                "household_size": h.household_size,
                "weekly_budget_gbp": float(h.weekly_budget_gbp) if h.weekly_budget_gbp else None,
                "role": membership.role,
                "joined_at": membership.joined_at.isoformat() if membership.joined_at else None,
                "created_at": h.created_at.isoformat() if h.created_at else None,
            })

    plans_data = []
    if household_ids:
        plans = (
            db.query(Plan)
            .filter(Plan.household_id.in_(household_ids))
            .order_by(Plan.created_at.desc())
            .all()
        )
        for p in plans:
            meals = (
                db.query(PlanMeal)
                .filter(PlanMeal.plan_id == p.id)
                .order_by(PlanMeal.meal_index)
                .all()
            )
            plans_data.append({
                "id": str(p.id),
                "title": p.title,
                "request_payload": p.request_payload,
                "response_payload": p.response_payload,
                "archived": p.archived,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "meals": [
                    {"meal_index": m.meal_index, "recipe_id": m.recipe_id}
                    for m in meals
                ],
            })

    push_subs = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == user_id)
        .all()
    )
    push_data = [
        {
            "endpoint": s.endpoint,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in push_subs
    ]

    export = {
        "exported_for_user_id": str(user_id),
        "profile": profile_data,
        "households": households_data,
        "plans": plans_data,
        "push_subscriptions": push_data,
    }

    return JSONResponse(
        content=export,
        headers={"Content-Disposition": "attachment; filename=pantry-data-export.json"},
    )


@router.delete("/account")
def delete_account(
    user_id: UUID = Depends(current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        return {"deleted": True}

    # Cancel Stripe subscription and delete customer
    if profile.stripe_customer_id:
        try:
            subs = stripe.Subscription.list(
                customer=profile.stripe_customer_id, status="active", limit=100,
            )
            for sub in subs.auto_paging_iter():
                stripe.Subscription.cancel(sub.id)
            stripe.Customer.delete(profile.stripe_customer_id)
        except stripe.StripeError:
            logger.exception("Stripe cleanup failed for customer %s", profile.stripe_customer_id)

    # Delete push subscriptions
    db.query(PushSubscription).filter(PushSubscription.user_id == user_id).delete()

    # Find households where this user is the sole member — delete them entirely
    user_households = (
        db.query(HouseholdMember.household_id)
        .filter(HouseholdMember.user_id == user_id)
    )
    sole_household_ids = (
        db.query(HouseholdMember.household_id)
        .filter(HouseholdMember.household_id.in_(user_households))
        .group_by(HouseholdMember.household_id)
        .having(func.count(HouseholdMember.user_id) == 1)
        .subquery()
    )
    # PlanMeals cascade from Plans, Plans cascade from Households
    db.query(Household).filter(Household.id.in_(sole_household_ids)).delete(synchronize_session="fetch")

    # Remove memberships from any shared households
    db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).delete()

    # Delete the profile
    db.delete(profile)
    db.commit()

    logger.info("Account deleted for user %s", user_id)
    return {"deleted": True}
