-- Allow public read access for active domains
-- Date: 2025-12-16
-- Issue: DomainRouter runs as anon/public but RLS prevented reading 'domains'.

-- 1. Create Policy for Public Read
-- We only allow reading 'active' domains to prevent leaking pending/failed ones if that matters,
-- though technically domain names shouldn't be secret.
-- 'status = active' is strict and good.

DROP POLICY IF EXISTS "Public can view active domains" ON domains;

CREATE POLICY "Public can view active domains"
ON domains FOR SELECT
USING (status = 'active');

-- Ensure authenticated users can still see their own pending domains (covered by existing policy, but good to verify overlap)
-- Existing policy: "Users can view their own domains" USING (auth.uid() = user_id)
-- Supabase merges policies with OR, so:
-- (auth.uid() = user_id) OR (status = 'active')
-- This works perfectly. Owner sees all, Public sees active.
