-- Migration: Add Monetization Fields
-- Adds subscription tracking to user profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Add comments
COMMENT ON COLUMN profiles.subscription_tier IS 'Current plan: free, starter, pro, premium';
COMMENT ON COLUMN profiles.subscription_status IS 'Status: active, trial, past_due, canceled';
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the free trial expires';
