-- Hotfix: Re-apply get_user_clicks_over_time function
-- This handles the 404 error by ensuring the function exists

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

GRANT EXECUTE ON FUNCTION get_user_clicks_over_time(UUID, INTEGER) TO authenticated;
