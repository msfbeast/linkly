-- Update record_click function to support visitor_id
-- Run this in Supabase SQL Editor

DROP FUNCTION IF EXISTS record_click(UUID, JSONB);

CREATE OR REPLACE FUNCTION record_click(
    p_link_id UUID, 
    p_click_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment click count on links table
    UPDATE links 
    SET clicks = clicks + 1,
        last_clicked = NOW()
    WHERE id = p_link_id;

    -- Insert detailed click event
    INSERT INTO click_events (
        link_id,
        user_agent,
        referrer,
        ip_address,
        country,
        city,
        device,
        browser,
        os,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        trigger_source,
        visitor_id,        -- New field
        destination_url    -- For A/B testing
    ) VALUES (
        p_link_id,
        p_click_data->>'userAgent',
        p_click_data->>'referrer',
        p_click_data->>'ipAddress',
        p_click_data->>'country',
        p_click_data->>'city',
        p_click_data->>'device',
        p_click_data->>'browser',
        p_click_data->>'os',
        p_click_data->>'utm_source',
        p_click_data->>'utm_medium',
        p_click_data->>'utm_campaign',
        p_click_data->>'utm_term',
        p_click_data->>'utm_content',
        p_click_data->>'trigger_source',
        p_click_data->>'visitorId',       -- Map from input JSON
        p_click_data->>'destinationUrl'   -- Map from input JSON
    );
END;
$$;

GRANT EXECUTE ON FUNCTION record_click(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION record_click(UUID, JSONB) TO authenticated;
