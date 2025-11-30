-- Migration: Analytics Optimization
-- Creates a summary table for faster analytics queries

CREATE TABLE IF NOT EXISTS analytics_daily_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  devices JSONB DEFAULT '{}'::jsonb,
  locations JSONB DEFAULT '{}'::jsonb,
  referrers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(link_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_summary_link_date ON analytics_daily_summary(link_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_daily_summary(date);

-- Comments
COMMENT ON TABLE analytics_daily_summary IS 'Pre-aggregated daily statistics for links';
COMMENT ON COLUMN analytics_daily_summary.devices IS 'JSON object with device counts e.g. {"mobile": 10, "desktop": 5}';
COMMENT ON COLUMN analytics_daily_summary.locations IS 'JSON object with country counts e.g. {"US": 10, "IN": 5}';
