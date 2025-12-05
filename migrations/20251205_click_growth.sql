-- Week-over-week click growth comparison
-- Run this in Supabase SQL Editor

-- Update the get_user_click_stats function to include last week's clicks
CREATE OR REPLACE FUNCTION get_user_click_stats(p_user_id UUID)
RETURNS TABLE (
    total_clicks BIGINT,
    unique_visitors BIGINT,
    clicks_today BIGINT,
    clicks_this_week BIGINT,
    clicks_last_week BIGINT,
    clicks_this_month BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_clicks,
        COUNT(*)::BIGINT as unique_visitors,
        COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE THEN 1 END)::BIGINT as clicks_today,
        COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::BIGINT as clicks_this_week,
        COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE - INTERVAL '14 days' 
                   AND ce.timestamp < CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::BIGINT as clicks_last_week,
        COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::BIGINT as clicks_this_month
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_click_stats(UUID) TO authenticated;
