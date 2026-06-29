"""POST /shopping-list — aggregate ingredients across a list of recipes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_db, current_user_id
from db.models import HouseholdMember, PantryItem
from db.queries import get_recipe_by_id
from planner.shopping import aggregate_shopping_list, _normalize_name


router = APIRouter(tags=["shopping"])


class ShoppingListRequest(BaseModel):
    recipe_ids: list[int] = Field(..., min_length=1, max_length=21)
    household_size: int = Field(..., gt=0, le=12)
    subtract_pantry: bool = Field(default=True)


class ShoppingItem(BaseModel):
    name: str
    grams: float
    estimated_cost_gbp: float
    appears_in: list[str]


class ShoppingCategory(BaseModel):
    name: str
    items: list[ShoppingItem]


class ShoppingListResponse(BaseModel):
    categories: list[ShoppingCategory]
    total_ingredients: int
    estimated_total_cost_gbp: float


@router.post("/shopping-list", response_model=ShoppingListResponse)
def make_shopping_list(
    request: ShoppingListRequest,
    db: Session = Depends(get_db),
    _user: UUID = Depends(current_user_id),
) -> ShoppingListResponse:
    recipes_with_servings = []
    for recipe_id in request.recipe_ids:
        recipe = get_recipe_by_id(db, recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")
        recipes_with_servings.append((recipe, recipe.servings))

    result = aggregate_shopping_list(recipes_with_servings, request.household_size)

    if request.subtract_pantry:
        membership = (
            db.query(HouseholdMember)
            .filter(HouseholdMember.user_id == _user)
            .first()
        )
        if membership:
            pantry_items = (
                db.query(PantryItem)
                .filter(PantryItem.household_id == membership.household_id, PantryItem.quantity_grams > 0)
                .all()
            )
            pantry_map = {item.name: item.quantity_grams for item in pantry_items}
            if pantry_map:
                for cat in result["categories"]:
                    filtered = []
                    for item in cat["items"]:
                        key = _normalize_name(item["name"])
                        if key in pantry_map:
                            remaining = item["grams"] - pantry_map[key]
                            if remaining <= 0:
                                continue
                            ratio = remaining / item["grams"]
                            item["grams"] = remaining
                            item["estimated_cost_gbp"] = round(item["estimated_cost_gbp"] * ratio, 2)
                        filtered.append(item)
                    cat["items"] = filtered
                result["categories"] = [c for c in result["categories"] if c["items"]]
                result["total_ingredients"] = sum(len(c["items"]) for c in result["categories"])
                result["estimated_total_cost_gbp"] = round(
                    sum(it["estimated_cost_gbp"] for c in result["categories"] for it in c["items"]), 2
                )

    return ShoppingListResponse(**result)