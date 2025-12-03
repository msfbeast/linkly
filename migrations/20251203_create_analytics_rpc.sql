-- Migration: Create Analytics RPC Functions
-- Defines functions to safely increment click counts

-- 1. Increment Link Clicks (Advanced)
-- Updates click count and last_clicked_at timestamp
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID, clicked_at TIMESTAMPTZ)
RETURNS void AS $$
BEGIN
  UPDATE links
  SET 
    clicks = clicks + 1,
    last_clicked_at = clicked_at
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Increment Clicks (Simple)
-- Updates click count only
CREATE OR REPLACE FUNCTION increment_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE links
  SET clicks = clicks + 1
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION increment_link_clicks IS 'Increments click count and updates last_clicked_at for a link';
COMMENT ON FUNCTION increment_clicks IS 'Increments click count for a link';
