-- Complete Analytics Aggregation Functions
-- Run this in Supabase SQL Editor to enable accurate analytics breakdowns

-- 1. Get country breakdown for a user's links
CREATE OR REPLACE FUNCTION get_user_country_breakdown(p_user_id UUID)
RETURNS TABLE (
    country TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ce.country, 'Unknown') as country,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY ce.country
    ORDER BY click_count DESC
    LIMIT 20;
END;
$$;

-- 2. Get city breakdown for a user's links
CREATE OR REPLACE FUNCTION get_user_city_breakdown(p_user_id UUID)
RETURNS TABLE (
    city TEXT,
    country TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ce.city, 'Unknown') as city,
        COALESCE(ce.country, 'Unknown') as country,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
      AND ce.city IS NOT NULL
    GROUP BY ce.city, ce.country
    ORDER BY click_count DESC
    LIMIT 20;
END;
$$;

-- 3. Get device breakdown for a user's links
CREATE OR REPLACE FUNCTION get_user_device_breakdown(p_user_id UUID)
RETURNS TABLE (
    device TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ce.device, 'Unknown') as device,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY ce.device
    ORDER BY click_count DESC;
END;
$$;

-- 4. Get referrer/source breakdown for a user's links
CREATE OR REPLACE FUNCTION get_user_referrer_breakdown(p_user_id UUID)
RETURNS TABLE (
    referrer TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            CASE 
                WHEN ce.referrer IS NULL OR ce.referrer = '' THEN 'Direct'
                WHEN ce.referrer LIKE '%google%' THEN 'Google'
                WHEN ce.referrer LIKE '%facebook%' OR ce.referrer LIKE '%fb.%' THEN 'Facebook'
                WHEN ce.referrer LIKE '%twitter%' OR ce.referrer LIKE '%t.co%' THEN 'Twitter/X'
                WHEN ce.referrer LIKE '%instagram%' THEN 'Instagram'
                WHEN ce.referrer LIKE '%linkedin%' THEN 'LinkedIn'
                WHEN ce.referrer LIKE '%youtube%' THEN 'YouTube'
                WHEN ce.referrer LIKE '%whatsapp%' THEN 'WhatsApp'
                WHEN ce.referrer LIKE '%telegram%' OR ce.referrer LIKE '%t.me%' THEN 'Telegram'
                ELSE 'Other'
            END,
            'Direct'
        ) as referrer,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY 
        CASE 
            WHEN ce.referrer IS NULL OR ce.referrer = '' THEN 'Direct'
            WHEN ce.referrer LIKE '%google%' THEN 'Google'
            WHEN ce.referrer LIKE '%facebook%' OR ce.referrer LIKE '%fb.%' THEN 'Facebook'
            WHEN ce.referrer LIKE '%twitter%' OR ce.referrer LIKE '%t.co%' THEN 'Twitter/X'
            WHEN ce.referrer LIKE '%instagram%' THEN 'Instagram'
            WHEN ce.referrer LIKE '%linkedin%' THEN 'LinkedIn'
            WHEN ce.referrer LIKE '%youtube%' THEN 'YouTube'
            WHEN ce.referrer LIKE '%whatsapp%' THEN 'WhatsApp'
            WHEN ce.referrer LIKE '%telegram%' OR ce.referrer LIKE '%t.me%' THEN 'Telegram'
            ELSE 'Other'
        END
    ORDER BY click_count DESC;
END;
$$;

-- 5. Get OS breakdown for a user's links
CREATE OR REPLACE FUNCTION get_user_os_breakdown(p_user_id UUID)
RETURNS TABLE (
    os TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ce.os, 'Unknown') as os,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY ce.os
    ORDER BY click_count DESC;
END;
$$;

-- 6. Get browser breakdown for a user's links  
CREATE OR REPLACE FUNCTION get_user_browser_breakdown(p_user_id UUID)
RETURNS TABLE (
    browser TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ce.browser, 'Unknown') as browser,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY ce.browser
    ORDER BY click_count DESC
    LIMIT 10;
END;
$$;

-- 7. Get clicks over time (daily) for a user
CREATE OR REPLACE FUNCTION get_user_clicks_over_time(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    click_date DATE,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ce.timestamp) as click_date,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
      AND ce.timestamp > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(ce.timestamp)
    ORDER BY click_date;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_country_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_city_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_device_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referrer_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_os_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_browser_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_clicks_over_time(UUID, INTEGER) TO authenticated;
