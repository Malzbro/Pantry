"""add user, household, and plan tables

Revision ID: b3e1a9c47d02
Revises: ad7f97772efe
Create Date: 2026-06-22 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision: str = 'b3e1a9c47d02'
down_revision: Union[str, Sequence[str], None] = 'ad7f97772efe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        'profiles',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('display_name', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'households',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('household_size', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('weekly_budget_gbp', sa.Numeric(10, 2), nullable=True),
        sa.Column('created_by_user_id', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.CheckConstraint('household_size > 0', name='ck_households_size_positive'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'household_members',
        sa.Column('household_id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Text(), nullable=False, server_default='owner'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.CheckConstraint("role IN ('owner', 'member')", name='ck_household_members_role'),
        sa.PrimaryKeyConstraint('household_id', 'user_id'),
    )
    op.create_index('ix_household_members_user_id', 'household_members', ['user_id'])

    op.create_table(
        'plans',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('household_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_by_user_id', UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.Text(), nullable=True),
        sa.Column('request_payload', JSONB(), nullable=False),
        sa.Column('response_payload', JSONB(), nullable=False),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['profiles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_plans_household_created', 'plans', ['household_id', sa.text('created_at DESC')])
    op.create_index('ix_plans_created_by_user_id', 'plans', ['created_by_user_id'])

    op.create_table(
        'plan_meals',
        sa.Column('plan_id', UUID(as_uuid=True), nullable=False),
        sa.Column('meal_index', sa.Integer(), nullable=False),
        sa.Column('recipe_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('plan_id', 'meal_index'),
    )
    op.create_index('ix_plan_meals_recipe_id', 'plan_meals', ['recipe_id'])


def downgrade() -> None:
    op.drop_index('ix_plan_meals_recipe_id', table_name='plan_meals')
    op.drop_table('plan_meals')
    op.drop_index('ix_plans_created_by_user_id', table_name='plans')
    op.drop_index('ix_plans_household_created', table_name='plans')
    op.drop_table('plans')
    op.drop_index('ix_household_members_user_id', table_name='household_members')
    op.drop_table('household_members')
    op.drop_table('households')
    op.drop_table('profiles')
