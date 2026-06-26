"""API-specific request/response schemas (separate from planner schemas)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PlanSummary(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    total_cost_gbp: float | None
    actual_cost_gbp: float | None
    archived: bool


class PlanDetail(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    archived: bool
    request_payload: dict
    response_payload: dict
    actual_cost_gbp: float | None


class ActualCostUpdate(BaseModel):
    actual_cost_gbp: float = Field(..., gt=0, le=9999)


class BudgetSummaryPlan(BaseModel):
    id: UUID
    created_at: datetime
    budget_gbp: float
    projected_cost_gbp: float
    actual_cost_gbp: float | None
    saved_gbp: float | None


class BudgetSummary(BaseModel):
    plans: list[BudgetSummaryPlan]
    total_projected_gbp: float
    total_actual_gbp: float | None
    total_saved_gbp: float | None
