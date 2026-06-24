"""Account endpoints: GDPR data export."""

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from api.deps import get_db, current_user_id
from db.models import (
    Profile, Household, HouseholdMember, Plan, PlanMeal, PushSubscription,
)

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
