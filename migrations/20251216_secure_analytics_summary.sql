-- Security Fix: Secure Analytics Summary Table
-- Date: 2025-12-16
-- Issue: Table was accessible without RLS
-- Fix: Enable RLS and restrict access to link owners

-- 1. Enable Row Level Security
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for SELECT (Reading Stats)
-- Users can only see stats for links they own
DROP POLICY IF EXISTS "Users can view analytics for their own links" ON analytics_daily_summary;

CREATE POLICY "Users can view analytics for their own links"
ON analytics_daily_summary
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM links
    WHERE links.id = analytics_daily_summary.link_id
    AND links.user_id = auth.uid()
  )
);

-- 3. Restrict Modifications
-- Only service role (automated jobs) should be modify these stats.
-- We do NOT create INSERT/UPDATE/DELETE policies for authenticated users.
-- This effectively makes the table read-only for frontend users.
