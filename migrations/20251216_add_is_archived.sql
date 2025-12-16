-- Add is_archived column to links table for soft delete support
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Update RLS policies (optional but good practice)
-- Ensure archived links are still viewable by owner
-- (Existing policies usually select based on user_id so it should be fine)
