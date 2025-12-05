-- Add new analytics columns to clicks table
ALTER TABLE clicks 
ADD COLUMN IF NOT EXISTS browser text,
ADD COLUMN IF NOT EXISTS os text,
ADD COLUMN IF NOT EXISTS device_type text;

-- Update the record_click function to accept and store these new fields
CREATE OR REPLACE FUNCTION record_click(
  p_link_id uuid,
  p_click_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_click_id uuid;
BEGIN
  -- Insert click record
  INSERT INTO clicks (
    link_id,
    timestamp,
    referrer,
    user_agent,
    ip_address,
    country,
    city,
    region,
    latitude,
    longitude,
    browser,
    os,
    device_type,
    device_model,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    visitor_id
  ) VALUES (
    p_link_id,
    to_timestamp((p_click_data->>'timestamp')::bigint / 1000.0),
    p_click_data->>'referrer',
    p_click_data->>'userAgent',
    p_click_data->>'ipAddress',
    p_click_data->>'country',
    p_click_data->>'city',
    p_click_data->>'region',
    (p_click_data->>'latitude')::numeric,
    (p_click_data->>'longitude')::numeric,
    p_click_data->>'browser',    -- New
    p_click_data->>'os',         -- New
    p_click_data->>'deviceType', -- New (mapped from 'device' in JSON)
    p_click_data->>'deviceModel',
    p_click_data->>'utm_source',
    p_click_data->>'utm_medium',
    p_click_data->>'utm_campaign',
    p_click_data->>'utm_term',
    p_click_data->>'utm_content',
    p_click_data->>'visitorId'
  ) RETURNING id INTO v_click_id;

  -- Update analytics stats (counters)
  -- Note: We generally don't scale counters for cardinality-heavy fields like 'browser' in the main jsonb counters 
  -- unless explicitly needed, but we can query them dynamically since we have the columns now.
  -- Existing logic for main counters remains the same.
  
  -- Increment link click count
  UPDATE links
  SET clicks = clicks + 1,
      last_clicked_at = to_timestamp((p_click_data->>'timestamp')::bigint / 1000.0)
  WHERE id = p_link_id;

END;
$$;
