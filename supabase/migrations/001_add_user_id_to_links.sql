-- Migration: Add user_id column to links table
-- Requirements: 5.1 - Associate links with user's ID

-- Add user_id column to links table with foreign key reference to auth.users
ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index on user_id for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);

-- Update existing links to be associated with a default user (optional)
-- This allows existing data to remain accessible during migration
-- In production, you may want to handle this differently based on your needs
-- COMMENT: Existing links without user_id will not be accessible after RLS is enabled
-- unless they are assigned to a user or a policy is created for anonymous access
