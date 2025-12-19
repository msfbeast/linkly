-- Hotfix: Create the missing OS breakdown analytics function
-- Run this in your Supabase SQL Editor to fix the 404 error

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

-- Grant functionality to authenticated users
GRANT EXECUTE ON FUNCTION get_user_os_breakdown(UUID) TO authenticated;