-- Add visitor_id column to click_events for unique visitor tracking
-- Run this in Supabase SQL Editor

-- 1. Add column
ALTER TABLE click_events 
ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- 2. Create index for performance (filtering/grouping)
CREATE INDEX IF NOT EXISTS idx_click_events_visitor_id ON click_events(visitor_id);

-- 3. Comment
COMMENT ON COLUMN click_events.visitor_id IS 'Privacy-preserving hash of user agent + IP + date + salt for unique visitor tracking';
