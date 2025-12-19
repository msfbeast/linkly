-- Migration: Add Username Field
-- Adds a unique username column to profiles for the enhanced signup flow

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for fast availability checks
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique handle for the user (e.g. gather.link/username)';

-- Add constraint to ensure valid username format (alphanumeric, underscores, hyphens)
ALTER TABLE profiles
  ADD CONSTRAINT check_username_format 
  CHECK (username ~* '^[a-zA-Z0-9_-]+$');
