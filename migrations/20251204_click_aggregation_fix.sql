-- Fixed Click Aggregation Functions
-- Run this in Supabase SQL Editor to REPLACE the previous functions

-- 1. Get aggregated click stats for a user's links (FIXED - removed visitor_id reference)
CREATE OR REPLACE FUNCTION get_user_click_stats(p_user_id UUID)
RETURNS TABLE (
    total_clicks BIGINT,
    unique_visitors BIGINT,
    clicks_today BIGINT,
    clicks_this_week BIGINT,
    clicks_this_month BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_clicks,
        COUNT(*)::BIGINT as unique_visitors,  -- Use total count since visitor_id doesn't exist
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '1 day')::BIGINT as clicks_today,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '7 days')::BIGINT as clicks_this_week,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '30 days')::BIGINT as clicks_this_month
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id;
END;
$$;

-- 2. Get stats for a specific link (FIXED)
CREATE OR REPLACE FUNCTION get_link_stats(p_link_id UUID)
RETURNS TABLE (
    total_clicks BIGINT,
    unique_visitors BIGINT,
    top_country TEXT,
    top_city TEXT,
    top_referrer TEXT,
    clicks_by_day JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH daily_clicks AS (
        SELECT 
            DATE(timestamp) as day,
            COUNT(*) as count
        FROM click_events
        WHERE link_id = p_link_id
          AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY day
    )
    SELECT 
        (SELECT COUNT(*) FROM click_events WHERE link_id = p_link_id)::BIGINT,
        (SELECT COUNT(*) FROM click_events WHERE link_id = p_link_id)::BIGINT,  -- Use total since no visitor_id
        (SELECT country FROM click_events WHERE link_id = p_link_id GROUP BY country ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT city FROM click_events WHERE link_id = p_link_id AND city IS NOT NULL GROUP BY city ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT referrer FROM click_events WHERE link_id = p_link_id AND referrer IS NOT NULL GROUP BY referrer ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT json_agg(json_build_object('day', day, 'count', count)) FROM daily_clicks);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_click_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_link_stats(UUID) TO authenticated;
