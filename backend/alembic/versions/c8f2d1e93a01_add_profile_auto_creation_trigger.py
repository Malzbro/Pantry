"""add profile auto-creation trigger

Revision ID: c8f2d1e93a01
Revises: b3e1a9c47d02
Create Date: 2026-06-22 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'c8f2d1e93a01'
down_revision: Union[str, Sequence[str], None] = 'b3e1a9c47d02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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

        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users")
    op.execute("DROP FUNCTION IF EXISTS public.handle_new_user()")
