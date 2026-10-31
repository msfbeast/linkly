-- Migration: Enhanced Analytics with Geolocation and Fingerprinting
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Add new columns to click_events table
-- ============================================

-- Browser column
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS browser TEXT DEFAULT 'Unknown';

-- Enhanced geolocation columns
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'XX';
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'Unknown';
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Unknown';
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS isp TEXT;

-- Device fingerprinting columns
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS screen_width INTEGER;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS screen_height INTEGER;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS color_depth INTEGER;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS cookies_enabled BOOLEAN;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS do_not_track BOOLEAN;
ALTER TABLE click_events ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- ============================================
-- 2. Create indexes for new columns
-- ============================================

CREATE INDEX IF NOT EXISTS idx_click_events_country ON click_events(country);
CREATE INDEX IF NOT EXISTS idx_click_events_country_code ON click_events(country_code);
CREATE INDEX IF NOT EXISTS idx_click_events_city ON click_events(city);
CREATE INDEX IF NOT EXISTS idx_click_events_browser ON click_events(browser);
CREATE INDEX IF NOT EXISTS idx_click_events_fingerprint ON click_events(fingerprint);

-- ============================================
-- 3. Create analytics views for easy querying
-- ============================================

-- View: Click counts by country
CREATE OR REPLACE VIEW click_stats_by_country AS
SELECT 
  link_id,
  country,
  country_code,
  COUNT(*) as click_count,
  COUNT(DISTINCT fingerprint) as unique_visitors
FROM click_events
GROUP BY link_id, country, country_code;

-- View: Click counts by city
CREATE OR REPLACE VIEW click_stats_by_city AS
SELECT 
  link_id,
  country,
  city,
  COUNT(*) as click_count,
  COUNT(DISTINCT fingerprint) as unique_visitors
FROM click_events
GROUP BY link_id, country, city;

-- View: Click counts by device
CREATE OR REPLACE VIEW click_stats_by_device AS
SELECT 
  link_id,
  device,
  os,
  browser,
  COUNT(*) as click_count
FROM click_events
GROUP BY link_id, device, os, browser;

-- View: Click counts by referrer
CREATE OR REPLACE VIEW click_stats_by_referrer AS
SELECT 
  link_id,
  referrer,
  COUNT(*) as click_count
FROM click_events
GROUP BY link_id, referrer;

-- View: Daily click trends
CREATE OR REPLACE VIEW click_stats_daily AS
SELECT 
  link_id,
  DATE(timestamp) as click_date,
  COUNT(*) as click_count,
  COUNT(DISTINCT fingerprint) as unique_visitors
FROM click_events
GROUP BY link_id, DATE(timestamp)
ORDER BY click_date DESC;

-- ============================================
-- 4. Grant access to views
-- ============================================

GRANT SELECT ON click_stats_by_country TO authenticated;
GRANT SELECT ON click_stats_by_city TO authenticated;
GRANT SELECT ON click_stats_by_device TO authenticated;
GRANT SELECT ON click_stats_by_referrer TO authenticated;
GRANT SELECT ON click_stats_daily TO authenticated;
