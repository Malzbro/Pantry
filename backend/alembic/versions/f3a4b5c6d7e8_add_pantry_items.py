"""add pantry_items table

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-06-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = 'f3a4b5c6d7e8'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pantry_items',
        sa.Column('id', UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('household_id', UUID(as_uuid=True), sa.ForeignKey('households.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('quantity_grams', sa.Float(), nullable=False, server_default='0'),
        sa.Column('category', sa.Text(), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_pantry_items_household_id', 'pantry_items', ['household_id'])
    op.create_index('ix_pantry_items_name', 'pantry_items', ['household_id', 'name'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_pantry_items_name', table_name='pantry_items')
    op.drop_index('ix_pantry_items_household_id', table_name='pantry_items')
    op.drop_table('pantry_items')
