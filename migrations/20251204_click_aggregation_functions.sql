-- Click Aggregation Functions for Scalable Analytics
-- Run this in Supabase SQL Editor

-- 1. Get aggregated click stats for a user's links
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
        COUNT(DISTINCT ce.visitor_id)::BIGINT as unique_visitors,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '1 day')::BIGINT as clicks_today,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '7 days')::BIGINT as clicks_this_week,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '30 days')::BIGINT as clicks_this_month
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id;
END;
$$;

-- 2. Get click trends by day for charts
CREATE OR REPLACE FUNCTION get_click_trends(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    day DATE,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ce.timestamp) as day,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
      AND ce.timestamp > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(ce.timestamp)
    ORDER BY day ASC;
END;
$$;

-- 3. Get top cities aggregated
CREATE OR REPLACE FUNCTION get_top_cities(
    p_user_id UUID,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    city TEXT,
    country TEXT,
    click_count BIGINT,
    percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    -- Get total clicks first
    SELECT COUNT(*) INTO v_total
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id AND ce.city IS NOT NULL;

    RETURN QUERY
    SELECT 
        ce.city,
        ce.country,
        COUNT(*)::BIGINT as click_count,
        ROUND((COUNT(*)::NUMERIC / NULLIF(v_total, 0)) * 100, 1) as percentage
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id AND ce.city IS NOT NULL
    GROUP BY ce.city, ce.country
    ORDER BY click_count DESC
    LIMIT p_limit;
END;
$$;

-- 4. Get traffic sources aggregated
CREATE OR REPLACE FUNCTION get_traffic_sources(p_user_id UUID)
RETURNS TABLE (
    source TEXT,
    click_count BIGINT,
    percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id;

    RETURN QUERY
    SELECT 
        COALESCE(
            CASE 
                WHEN ce.referrer ILIKE '%google%' THEN 'Google'
                WHEN ce.referrer ILIKE '%facebook%' OR ce.referrer ILIKE '%fb.%' THEN 'Facebook'
                WHEN ce.referrer ILIKE '%twitter%' OR ce.referrer ILIKE '%t.co%' THEN 'Twitter'
                WHEN ce.referrer ILIKE '%instagram%' THEN 'Instagram'
                WHEN ce.referrer ILIKE '%linkedin%' THEN 'LinkedIn'
                WHEN ce.referrer ILIKE '%youtube%' THEN 'YouTube'
                WHEN ce.referrer IS NULL OR ce.referrer = '' THEN 'Direct'
                ELSE 'Other'
            END,
            'Direct'
        ) as source,
        COUNT(*)::BIGINT as click_count,
        ROUND((COUNT(*)::NUMERIC / NULLIF(v_total, 0)) * 100, 1) as percentage
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY source
    ORDER BY click_count DESC;
END;
$$;

-- 5. Get device/browser breakdown
CREATE OR REPLACE FUNCTION get_device_breakdown(p_user_id UUID)
RETURNS TABLE (
    device TEXT,
    browser TEXT,
    click_count BIGINT,
    percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id;

    RETURN QUERY
    SELECT 
        COALESCE(ce.device, 'Unknown') as device,
        COALESCE(ce.browser, 'Unknown') as browser,
        COUNT(*)::BIGINT as click_count,
        ROUND((COUNT(*)::NUMERIC / NULLIF(v_total, 0)) * 100, 1) as percentage
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY ce.device, ce.browser
    ORDER BY click_count DESC
    LIMIT 20;
END;
$$;

-- 6. Get link-specific stats (for individual link analytics page)
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
        (SELECT COUNT(DISTINCT visitor_id) FROM click_events WHERE link_id = p_link_id)::BIGINT,
        (SELECT country FROM click_events WHERE link_id = p_link_id GROUP BY country ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT city FROM click_events WHERE link_id = p_link_id AND city IS NOT NULL GROUP BY city ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT referrer FROM click_events WHERE link_id = p_link_id AND referrer IS NOT NULL GROUP BY referrer ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT json_agg(json_build_object('day', day, 'count', count)) FROM daily_clicks);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_click_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_click_trends(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_cities(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_traffic_sources(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_device_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_link_stats(UUID) TO authenticated;
