-- Add actual_cost_gbp column to plans table for budget dashboard
-- Run this against your Supabase/Postgres database

ALTER TABLE plans
ADD COLUMN actual_cost_gbp NUMERIC(10, 2);
