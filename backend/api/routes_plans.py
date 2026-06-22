"""GET /plans — list and fetch persisted meal plans."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.deps import get_db, current_user_id
from api.schemas import PlanSummary, PlanDetail
from db.models import Plan, HouseholdMember


router = APIRouter(tags=["plans"])


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
            archived=p.archived,
        )
        for p in rows
    ]


@router.get("/plans/{plan_id}", response_model=PlanDetail)
def get_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
) -> PlanDetail:
    """Return a single persisted plan. 404 if not found or not the user's."""
    plan = (
        db.query(Plan)
        .join(HouseholdMember, HouseholdMember.household_id == Plan.household_id)
        .filter(Plan.id == plan_id, HouseholdMember.user_id == user_id)
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return PlanDetail(
        id=plan.id,
        title=plan.title,
        created_at=plan.created_at,
        archived=plan.archived,
        request_payload=plan.request_payload,
        response_payload=plan.response_payload,
    )
