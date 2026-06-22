"""API-specific request/response schemas (separate from planner schemas)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PlanSummary(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    total_cost_gbp: float | None
    archived: bool


class PlanDetail(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    archived: bool
    request_payload: dict
    response_payload: dict
