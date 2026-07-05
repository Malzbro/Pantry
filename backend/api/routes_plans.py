"""GET /plans — list and fetch persisted meal plans."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_db, current_user_id
from api.schemas import PlanSummary, PlanDetail, ActualCostUpdate, BudgetSummary, BudgetSummaryPlan, SavingsPeriod
from db.models import Plan, HouseholdMember, Household
from planner.savings import ons_weekly_baseline_gbp


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


def _savings_period(
    plans_in_period: list[tuple[float, float | None]],
    baseline_weekly_gbp: float,
) -> SavingsPeriod:
    projected = sum(p for p, _ in plans_in_period)
    actuals = [a for _, a in plans_in_period if a is not None]
    actual_total = sum(actuals) if actuals else None
    saved = round(projected - actual_total, 2) if actual_total is not None else None

    # Rebased savings: compare the period's real spend (actual where recorded,
    # projected otherwise) against an external baseline, not the user's budget.
    if plans_in_period:
        spend = sum(a if a is not None else p for p, a in plans_in_period)
        baseline_total = baseline_weekly_gbp * len(plans_in_period)
        baseline_gbp = round(baseline_total, 2)
        baseline_saved_gbp = round(baseline_total - spend, 2)
    else:
        baseline_gbp = None
        baseline_saved_gbp = None

    return SavingsPeriod(
        projected_gbp=round(projected, 2),
        actual_gbp=round(actual_total, 2) if actual_total is not None else None,
        saved_gbp=saved,
        plan_count=len(plans_in_period),
        baseline_gbp=baseline_gbp,
        baseline_saved_gbp=baseline_saved_gbp,
    )


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

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    plans = []
    total_projected = 0.0
    total_actual = 0.0
    has_any_actual = False
    recorded_actuals: list[float] = []
    household_size: int | None = None
    week_plans: list[tuple[float, float | None]] = []
    month_plans: list[tuple[float, float | None]] = []

    for p in rows:
        budget = p.request_payload.get("weekly_budget_gbp", 0) if p.request_payload else 0
        projected = p.response_payload.get("total_cost_gbp", 0) if p.response_payload else 0
        actual = float(p.actual_cost_gbp) if p.actual_cost_gbp is not None else None
        saved = round(projected - actual, 2) if actual is not None else None

        total_projected += projected
        if actual is not None:
            total_actual += actual
            has_any_actual = True
            recorded_actuals.append(actual)

        # rows are newest-first, so the first plan we see gives the latest household size.
        if household_size is None and p.request_payload:
            hs = p.request_payload.get("household_size")
            if hs:
                household_size = int(hs)

        plans.append(BudgetSummaryPlan(
            id=p.id,
            created_at=p.created_at,
            budget_gbp=budget,
            projected_cost_gbp=projected,
            actual_cost_gbp=actual,
            saved_gbp=saved,
        ))

        created = p.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created >= week_start:
            week_plans.append((projected, actual))
        if created >= month_start:
            month_plans.append((projected, actual))

    # Household size for the ONS fallback: latest plan → household record → 1.
    if household_size is None:
        household = (
            db.query(Household)
            .join(HouseholdMember, HouseholdMember.household_id == Household.id)
            .filter(HouseholdMember.user_id == user_id)
            .first()
        )
        household_size = household.household_size if household else 1

    # Pick the strongest available baseline: the user's own average recorded shop
    # once they have history, otherwise the ONS UK average for their household size.
    if recorded_actuals:
        baseline_source = "personal"
        baseline_weekly = round(sum(recorded_actuals) / len(recorded_actuals), 2)
    else:
        baseline_source = "ons"
        baseline_weekly = ons_weekly_baseline_gbp(household_size)

    return BudgetSummary(
        plans=plans,
        total_projected_gbp=round(total_projected, 2),
        total_actual_gbp=round(total_actual, 2) if has_any_actual else None,
        total_saved_gbp=round(total_projected - total_actual, 2) if has_any_actual else None,
        this_week=_savings_period(week_plans, baseline_weekly),
        this_month=_savings_period(month_plans, baseline_weekly),
        household_size=household_size,
        baseline_source=baseline_source,
        baseline_weekly_gbp=baseline_weekly,
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
