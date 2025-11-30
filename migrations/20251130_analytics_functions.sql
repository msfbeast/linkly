-- Migration: Analytics Aggregation Function
-- Function to aggregate raw click events into daily summaries

CREATE OR REPLACE FUNCTION aggregate_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  -- Loop through all links that had clicks on the target date
  FOR r IN 
    SELECT 
      link_id,
      COUNT(*) as total_clicks,
      COUNT(DISTINCT visitor_id) as unique_count,
      jsonb_object_agg(device, count) as device_stats,
      jsonb_object_agg(country, count) as location_stats
    FROM (
      SELECT 
        link_id,
        visitor_id,
        device,
        country,
        COUNT(*) as count
      FROM click_events
      WHERE date(created_at) = target_date
      GROUP BY link_id, visitor_id, device, country
    ) raw_stats
    GROUP BY link_id
  LOOP
    -- Upsert into summary table
    INSERT INTO analytics_daily_summary (
      link_id, 
      date, 
      clicks, 
      unique_visitors, 
      devices, 
      locations
    )
    VALUES (
      r.link_id, 
      target_date, 
      r.total_clicks, 
      r.unique_count, 
      r.device_stats, 
      r.location_stats
    )
    ON CONFLICT (link_id, date) 
    DO UPDATE SET 
      clicks = EXCLUDED.clicks,
      unique_visitors = EXCLUDED.unique_visitors,
      devices = EXCLUDED.devices,
      locations = EXCLUDED.locations,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION aggregate_daily_stats IS 'Aggregates click_events into analytics_daily_summary for a specific date';
