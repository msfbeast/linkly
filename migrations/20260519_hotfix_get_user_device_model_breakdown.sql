-- Hotfix: Create the missing Device Model breakdown analytics function
-- Run this in your Supabase SQL Editor to fix the 500 error

CREATE OR REPLACE FUNCTION get_user_device_model_breakdown(p_user_id UUID)
RETURNS TABLE (
    device_model TEXT,
    click_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Unknown'::TEXT as device_model,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY 1
    ORDER BY click_count DESC;
END;
$$;

-- Grant functionality to authenticated users
GRANT EXECUTE ON FUNCTION get_user_device_model_breakdown(UUID) TO authenticated;
