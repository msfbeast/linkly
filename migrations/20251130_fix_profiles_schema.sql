-- Migration: Add Onboarding Columns to Profiles
-- Fixes 400 error when fetching profile data

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN profiles.onboarding_completed IS 'True if user has finished the onboarding tour';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in the onboarding tour';
COMMENT ON COLUMN profiles.onboarding_skipped IS 'True if user explicitly skipped the tour';
