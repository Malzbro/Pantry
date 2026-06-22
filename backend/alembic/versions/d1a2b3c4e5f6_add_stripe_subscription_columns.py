"""add stripe subscription columns and email to profiles

Revision ID: d1a2b3c4e5f6
Revises: c8f2d1e93a01
Create Date: 2026-06-22 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd1a2b3c4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c8f2d1e93a01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('profiles', sa.Column('email', sa.Text(), nullable=True))
    op.add_column('profiles', sa.Column('stripe_customer_id', sa.Text(), nullable=True))
    op.add_column('profiles', sa.Column('subscription_status', sa.Text(), nullable=True))
    op.add_column('profiles', sa.Column('subscription_tier', sa.Text(), nullable=True))
    op.add_column('profiles', sa.Column('subscription_current_period_end', sa.DateTime(timezone=True), nullable=True))
    op.add_column('profiles', sa.Column('subscription_cancel_at_period_end', sa.Boolean(), server_default='false', nullable=False))

    op.create_index('ix_profiles_stripe_customer_id', 'profiles', ['stripe_customer_id'], unique=True)

    # Update the auth trigger to also set email on new signups
    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
        AS $$
        DECLARE
            new_household_id UUID;
        BEGIN
            INSERT INTO public.profiles (id, display_name, email)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
                NEW.email
            );

            INSERT INTO public.households (created_by_user_id, name, household_size)
            VALUES (NEW.id, 'My household', 1)
            RETURNING id INTO new_household_id;

            INSERT INTO public.household_members (household_id, user_id, role)
            VALUES (new_household_id, NEW.id, 'owner');

            RETURN NEW;
        END;
        $$;
    """)

    # Backfill email for existing profiles
    op.execute("""
        UPDATE public.profiles
        SET email = u.email
        FROM auth.users u
        WHERE profiles.id = u.id AND profiles.email IS NULL;
    """)


def downgrade() -> None:
    # Restore the original trigger (without email)
    op.execute("""
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
        AS $$
        DECLARE
            new_household_id UUID;
        BEGIN
            INSERT INTO public.profiles (id, display_name)
            VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

            INSERT INTO public.households (created_by_user_id, name, household_size)
            VALUES (NEW.id, 'My household', 1)
            RETURNING id INTO new_household_id;

            INSERT INTO public.household_members (household_id, user_id, role)
            VALUES (new_household_id, NEW.id, 'owner');

            RETURN NEW;
        END;
        $$;
    """)

    op.drop_index('ix_profiles_stripe_customer_id', table_name='profiles')
    op.drop_column('profiles', 'subscription_cancel_at_period_end')
    op.drop_column('profiles', 'subscription_current_period_end')
    op.drop_column('profiles', 'subscription_tier')
    op.drop_column('profiles', 'subscription_status')
    op.drop_column('profiles', 'stripe_customer_id')
    op.drop_column('profiles', 'email')
