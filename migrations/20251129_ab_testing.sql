-- Migration: Add A/B Testing support
-- Date: 2025-11-29

-- Add ab_test_config to links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT NULL;

-- Add destination_url to click_events table to track which variant was served
ALTER TABLE click_events
ADD COLUMN IF NOT EXISTS destination_url TEXT;

-- Comment on columns
COMMENT ON COLUMN links.ab_test_config IS 'Configuration for A/B testing: { enabled: boolean, variants: [{ id: string, url: string, weight: number }] }';
COMMENT ON COLUMN click_events.destination_url IS 'The actual destination URL the user was redirected to (for A/B testing tracking)';
