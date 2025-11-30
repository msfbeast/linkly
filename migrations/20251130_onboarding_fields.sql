-- Migration: Add Onboarding Fields to Profiles
-- Tracks user progress through the interactive tour

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'True if user has finished the onboarding tour';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step number in the onboarding tour';
COMMENT ON COLUMN profiles.onboarding_skipped IS 'True if user explicitly skipped the tour';
