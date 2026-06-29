"""POST /plan — generate a weekly meal plan and persist it."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.deps import get_db, current_user_id
from db.models import HouseholdMember, Plan, PlanMeal, PantryItem
from db.queries import get_recipe_by_id
from planner.planner import plan_week
from planner.schemas import PlanRequest, PlanResponse
from planner.shopping import _normalize_name


router = APIRouter(tags=["plan"])


def _get_household_id(db: Session, user_id: UUID) -> UUID:
    """Return the first household the user belongs to."""
    membership = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.user_id == user_id)
        .first()
    )
    if membership is None:
        raise HTTPException(status_code=400, detail="User has no household")
    return membership.household_id


@router.post("/plan", response_model=PlanResponse)
def create_plan(
    request: PlanRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
) -> PlanResponse:
    """Generate a weekly meal plan from a budget and preferences."""
    try:
        response = plan_week(db, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Planning failed: {e}")

    household_id = _get_household_id(db, user_id)

    plan = Plan(
        household_id=household_id,
        created_by_user_id=user_id,
        request_payload=request.model_dump(mode="json"),
        response_payload=response.model_dump(mode="json"),
    )
    db.add(plan)
    db.flush()

    for idx, meal in enumerate(response.meals):
        db.add(PlanMeal(plan_id=plan.id, meal_index=idx, recipe_id=meal.recipe_id))

    db.commit()
    db.refresh(plan)

    response.plan_id = plan.id

    _deplete_pantry(db, household_id, response, request.household_size)

    return response


def _deplete_pantry(
    db: Session, household_id: UUID, response: PlanResponse, household_size: int
) -> None:
    """Auto-deduct ingredients used in the plan from the household pantry."""
    pantry_items = (
        db.query(PantryItem)
        .filter(PantryItem.household_id == household_id, PantryItem.quantity_grams > 0)
        .all()
    )
    if not pantry_items:
        return

    pantry_map = {item.name: item for item in pantry_items}

    for meal in response.meals:
        recipe = get_recipe_by_id(db, meal.recipe_id)
        if not recipe:
            continue
        scale = max(1.0, household_size / recipe.servings)
        for ing in recipe.ingredients:
            key = _normalize_name(ing.name)
            if key in pantry_map:
                pantry_map[key].quantity_grams = max(
                    0, pantry_map[key].quantity_grams - (ing.grams * scale)
                )

    db.commit()
