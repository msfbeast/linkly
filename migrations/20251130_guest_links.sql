-- Migration: Add Guest Link Support
-- Enables zero-friction link creation without signup
-- Links expire after 7 days to drive conversions

-- Add guest link columns to links table
ALTER TABLE links
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_token VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Make user_id nullable for guest links
ALTER TABLE links
  ALTER COLUMN user_id DROP NOT NULL;

-- Add index for efficient cleanup of expired guest links
CREATE INDEX IF NOT EXISTS idx_guest_links_expiry 
  ON links(is_guest, expires_at) 
  WHERE is_guest = true;

-- Add index for claim token lookups
CREATE INDEX IF NOT EXISTS idx_links_claim_token 
  ON links(claim_token) 
  WHERE claim_token IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN links.is_guest IS 'True if link was created without authentication';
COMMENT ON COLUMN links.claim_token IS 'Unique token for claiming guest links';
COMMENT ON COLUMN links.expires_at IS 'Expiration timestamp for guest links (7 days from creation)';
