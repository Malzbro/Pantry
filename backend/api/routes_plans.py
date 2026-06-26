"""GET /plans — list and fetch persisted meal plans."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_db, current_user_id
from api.schemas import PlanSummary, PlanDetail, ActualCostUpdate, BudgetSummary, BudgetSummaryPlan
from db.models import Plan, HouseholdMember


router = APIRouter(tags=["plans"])


def _user_plan(db: Session, plan_id: UUID, user_id: UUID) -> Plan:
    plan = (
        db.query(Plan)
        .join(HouseholdMember, HouseholdMember.household_id == Plan.household_id)
        .filter(Plan.id == plan_id, HouseholdMember.user_id == user_id)
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.get("/plans", response_model=list[PlanSummary])
def list_plans(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
) -> list[PlanSummary]:
    """Return the current user's most recent plans (lightweight)."""
    rows = (
        db.query(Plan)
        .join(HouseholdMember, HouseholdMember.household_id == Plan.household_id)
        .filter(HouseholdMember.user_id == user_id)
        .order_by(Plan.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        PlanSummary(
            id=p.id,
            title=p.title,
            created_at=p.created_at,
            total_cost_gbp=p.response_payload.get("total_cost_gbp") if p.response_payload else None,
            actual_cost_gbp=float(p.actual_cost_gbp) if p.actual_cost_gbp is not None else None,
            archived=p.archived,
        )
        for p in rows
    ]


@router.get("/plans/budget-summary", response_model=BudgetSummary)
def budget_summary(
    limit: int = Query(default=12, ge=1, le=52),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
) -> BudgetSummary:
    """Projected vs actual cost summary across recent plans."""
    rows = (
        db.query(Plan)
        .join(HouseholdMember, HouseholdMember.household_id == Plan.household_id)
        .filter(HouseholdMember.user_id == user_id, Plan.archived == False)
        .order_by(Plan.created_at.desc())
        .limit(limit)
        .all()
    )

    plans = []
    total_projected = 0.0
    total_actual = 0.0
    has_any_actual = False

    for p in rows:
        budget = p.request_payload.get("weekly_budget_gbp", 0) if p.request_payload else 0
        projected = p.response_payload.get("total_cost_gbp", 0) if p.response_payload else 0
        actual = float(p.actual_cost_gbp) if p.actual_cost_gbp is not None else None
        saved = round(projected - actual, 2) if actual is not None else None

        total_projected += projected
        if actual is not None:
            total_actual += actual
            has_any_actual = True

        plans.append(BudgetSummaryPlan(
            id=p.id,
            created_at=p.created_at,
            budget_gbp=budget,
            projected_cost_gbp=projected,
            actual_cost_gbp=actual,
            saved_gbp=saved,
        ))

    return BudgetSummary(
        plans=plans,
        total_projected_gbp=round(total_projected, 2),
        total_actual_gbp=round(total_actual, 2) if has_any_actual else None,
        total_saved_gbp=round(total_projected - total_actual, 2) if has_any_actual else None,
    )


@router.get("/plans/{plan_id}", response_model=PlanDetail)
def get_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
) -> PlanDetail:
    """Return a single persisted plan. 404 if not found or not the user's."""
    plan = _user_plan(db, plan_id, user_id)
    return PlanDetail(
        id=plan.id,
        title=plan.title,
        created_at=plan.created_at,
        archived=plan.archived,
        request_payload=plan.request_payload,
        response_payload=plan.response_payload,
        actual_cost_gbp=float(plan.actual_cost_gbp) if plan.actual_cost_gbp is not None else None,
    )


@router.patch("/plans/{plan_id}/actual-cost", response_model=PlanDetail)
def update_actual_cost(
    plan_id: UUID,
    body: ActualCostUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
) -> PlanDetail:
    """Record what the user actually spent on this plan's shop."""
    plan = _user_plan(db, plan_id, user_id)
    plan.actual_cost_gbp = body.actual_cost_gbp
    db.commit()
    db.refresh(plan)
    return PlanDetail(
        id=plan.id,
        title=plan.title,
        created_at=plan.created_at,
        archived=plan.archived,
        request_payload=plan.request_payload,
        response_payload=plan.response_payload,
        actual_cost_gbp=float(plan.actual_cost_gbp) if plan.actual_cost_gbp is not None else None,
    )
