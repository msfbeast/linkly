-- Consolidated Fix for Domains Table
-- Run this in your Supabase SQL Editor to ensure Custom Domains work correctly.

-- 1. Create table if it doesn't exist (using the modern schema)
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- Link to auth.users directly for RLS safety
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'failed')) DEFAULT 'pending',
  verification_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  target_type TEXT CHECK (target_type IN ('bio', 'store')) DEFAULT 'bio',
  CONSTRAINT domains_domain_key UNIQUE (domain)
);

-- 2. Ensure target_type column exists (if table already existed globally)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'domains' AND column_name = 'target_type') THEN
        ALTER TABLE domains ADD COLUMN target_type TEXT CHECK (target_type IN ('bio', 'store')) DEFAULT 'bio';
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to ensure clean slate (avoids duplicates)
DROP POLICY IF EXISTS "Users can view their own domains" ON domains;
DROP POLICY IF EXISTS "Users can create their own domains" ON domains;
DROP POLICY IF EXISTS "Users can update their own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete their own domains" ON domains;
DROP POLICY IF EXISTS "Users can manage their own domains" ON domains; -- Fallback cleanup

-- 5. Re-create precise policies
CREATE POLICY "Users can view their own domains"
  ON domains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own domains"
  ON domains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
  ON domains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
  ON domains FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
