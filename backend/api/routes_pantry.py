"""Pantry CRUD — manage household ingredient inventory."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from api.deps import get_db, current_user_id
from db.models import HouseholdMember, PantryItem
from planner.shopping import _normalize_name, _classify

router = APIRouter(prefix="/pantry", tags=["pantry"])


def _get_household_id(db: Session, user_id: UUID) -> UUID:
    membership = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.user_id == user_id)
        .first()
    )
    if membership is None:
        raise HTTPException(status_code=400, detail="User has no household")
    return membership.household_id


# ── Schemas ───────────────────────────────────────────────────────────

class PantryItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    quantity_grams: float = Field(..., gt=0)

class PantryItemUpdate(BaseModel):
    quantity_grams: float = Field(..., ge=0)

class PantryItemOut(BaseModel):
    id: str
    name: str
    quantity_grams: float
    category: str | None
    added_at: str
    updated_at: str

class PantryListResponse(BaseModel):
    items: list[PantryItemOut]
    total_items: int


# ── Routes ────────────────────────────────────────────────────────────

@router.get("", response_model=PantryListResponse)
def list_pantry(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
):
    household_id = _get_household_id(db, user_id)
    items = (
        db.query(PantryItem)
        .filter(PantryItem.household_id == household_id, PantryItem.quantity_grams > 0)
        .order_by(PantryItem.name)
        .all()
    )
    return PantryListResponse(
        items=[
            PantryItemOut(
                id=str(it.id),
                name=it.name,
                quantity_grams=it.quantity_grams,
                category=it.category,
                added_at=it.added_at.isoformat(),
                updated_at=it.updated_at.isoformat(),
            )
            for it in items
        ],
        total_items=len(items),
    )


@router.post("", response_model=PantryItemOut, status_code=201)
def add_pantry_item(
    body: PantryItemCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
):
    household_id = _get_household_id(db, user_id)
    normalized = _normalize_name(body.name)
    category = _classify(body.name)

    existing = (
        db.query(PantryItem)
        .filter(PantryItem.household_id == household_id, PantryItem.name == normalized)
        .first()
    )
    if existing:
        existing.quantity_grams += body.quantity_grams
        existing.updated_at = func.now()
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = PantryItem(
            household_id=household_id,
            name=normalized,
            quantity_grams=body.quantity_grams,
            category=category,
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    return PantryItemOut(
        id=str(item.id),
        name=item.name,
        quantity_grams=item.quantity_grams,
        category=item.category,
        added_at=item.added_at.isoformat(),
        updated_at=item.updated_at.isoformat(),
    )


@router.patch("/{item_id}", response_model=PantryItemOut)
def update_pantry_item(
    item_id: str,
    body: PantryItemUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
):
    household_id = _get_household_id(db, user_id)
    item = (
        db.query(PantryItem)
        .filter(PantryItem.id == item_id, PantryItem.household_id == household_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    item.quantity_grams = body.quantity_grams
    item.updated_at = func.now()
    db.commit()
    db.refresh(item)

    return PantryItemOut(
        id=str(item.id),
        name=item.name,
        quantity_grams=item.quantity_grams,
        category=item.category,
        added_at=item.added_at.isoformat(),
        updated_at=item.updated_at.isoformat(),
    )


@router.delete("/{item_id}", status_code=204)
def delete_pantry_item(
    item_id: str,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(current_user_id),
):
    household_id = _get_household_id(db, user_id)
    item = (
        db.query(PantryItem)
        .filter(PantryItem.id == item_id, PantryItem.household_id == household_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    db.delete(item)
    db.commit()
