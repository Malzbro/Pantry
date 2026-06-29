"""SQLAlchemy models for the recipe database.

Schema overview:
    recipes ────┬──< ingredients
                ├──< steps
                ├──< recipe_tags >── tags
                └──< recipe_appliances >── appliances

Many-to-many relationships (tags, appliances) use junction tables
so the same tag/appliance row is shared across many recipes.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Text, ForeignKey, Table, Index,
    Boolean, CheckConstraint, Numeric, DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


# Junction tables for many-to-many relationships.
recipe_tags = Table(
    "recipe_tags", Base.metadata,
    Column("recipe_id", ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

recipe_appliances = Table(
    "recipe_appliances", Base.metadata,
    Column("recipe_id", ForeignKey("recipes.id", ondelete="CASCADE"), primary_key=True),
    Column("appliance_id", ForeignKey("appliances.id", ondelete="CASCADE"), primary_key=True),
)


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False, unique=True)
    cuisine = Column(String, nullable=False, index=True)
    servings = Column(Integer, nullable=False)
    calories_per_serving = Column(Integer, nullable=False, index=True)
    prep_minutes = Column(Integer, nullable=False)

    # Denormalized cost columns: cheaper to query than summing ingredients each time.
    total_cost_gbp = Column(Float, nullable=False, index=True)
    cost_per_serving_gbp = Column(Float, nullable=False, index=True)

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    steps = relationship("Step", back_populates="recipe", cascade="all, delete-orphan", order_by="Step.position")
    tags = relationship("Tag", secondary=recipe_tags, back_populates="recipes")
    appliances = relationship("Appliance", secondary=recipe_appliances, back_populates="recipes")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False, index=True)
    grams = Column(Float, nullable=False)
    est_price_gbp = Column(Float, nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")


class Step(Base):
    __tablename__ = "steps"

    id = Column(Integer, primary_key=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)  # 1, 2, 3...
    content = Column(Text, nullable=False)

    recipe = relationship("Recipe", back_populates="steps")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)

    recipes = relationship("Recipe", secondary=recipe_tags, back_populates="tags")


class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True, index=True)

    recipes = relationship("Recipe", secondary=recipe_appliances, back_populates="appliances")


# Composite index for the planner's most common query shape:
# "vegetarian recipes under £X per serving, sorted by cost"
Index("idx_recipes_cost_calories", Recipe.cost_per_serving_gbp, Recipe.calories_per_serving)


# ---------------------------------------------------------------------------
# User / household / plan tables
# ---------------------------------------------------------------------------

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    display_name = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    stripe_customer_id = Column(Text, nullable=True, unique=True, index=True)
    subscription_status = Column(Text, nullable=True)
    subscription_tier = Column(Text, nullable=True)
    subscription_current_period_end = Column(DateTime(timezone=True), nullable=True)
    subscription_cancel_at_period_end = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    memberships = relationship("HouseholdMember", back_populates="user", cascade="all, delete-orphan")


class Household(Base):
    __tablename__ = "households"
    __table_args__ = (
        CheckConstraint("household_size > 0", name="ck_households_size_positive"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(Text, nullable=True)
    household_size = Column(Integer, nullable=False, server_default="1")
    weekly_budget_gbp = Column(Numeric(10, 2), nullable=True)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    members = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="household", cascade="all, delete-orphan")


class HouseholdMember(Base):
    __tablename__ = "household_members"
    __table_args__ = (
        CheckConstraint("role IN ('owner', 'member')", name="ck_household_members_role"),
        Index("ix_household_members_user_id", "user_id"),
    )

    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    role = Column(Text, nullable=False, server_default="owner")
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    household = relationship("Household", back_populates="members")
    user = relationship("Profile", back_populates="memberships")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    title = Column(Text, nullable=True)
    request_payload = Column(JSONB, nullable=False)
    response_payload = Column(JSONB, nullable=False)
    actual_cost_gbp = Column(Numeric(10, 2), nullable=True)
    archived = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    household = relationship("Household", back_populates="plans")
    meals = relationship("PlanMeal", back_populates="plan", cascade="all, delete-orphan")


Index("ix_plans_household_created", Plan.household_id, Plan.created_at.desc())
Index("ix_plans_created_by_user_id", Plan.created_by_user_id)


class PlanMeal(Base):
    __tablename__ = "plan_meals"
    __table_args__ = (
        Index("ix_plan_meals_recipe_id", "recipe_id"),
    )

    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id", ondelete="CASCADE"), primary_key=True)
    meal_index = Column(Integer, primary_key=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)

    plan = relationship("Plan", back_populates="meals")


class PantryItem(Base):
    __tablename__ = "pantry_items"
    __table_args__ = (
        Index("ix_pantry_items_household_id", "household_id"),
        Index("ix_pantry_items_name", "household_id", "name", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    household_id = Column(UUID(as_uuid=True), ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    quantity_grams = Column(Float, nullable=False, default=0)
    category = Column(Text, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    household = relationship("Household")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    __table_args__ = (
        Index("ix_push_subscriptions_user_id", "user_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(Text, nullable=False, unique=True)
    key_p256dh = Column(Text, nullable=False)
    key_auth = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)