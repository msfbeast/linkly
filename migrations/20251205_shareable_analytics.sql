-- Shareable Analytics Feature
-- Run in Supabase SQL Editor

-- Table to store share tokens
CREATE TABLE IF NOT EXISTS analytics_share_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON analytics_share_tokens(token);

-- RPC function to get shared analytics (public access via token)
CREATE OR REPLACE FUNCTION get_shared_analytics(p_share_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_display_name TEXT;
    v_result JSON;
BEGIN
    -- Get user_id from token
    SELECT user_id INTO v_user_id
    FROM analytics_share_tokens
    WHERE token = p_share_token
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get display name from bio_profiles or profiles
    SELECT COALESCE(bp.display_name, p.full_name, 'User') INTO v_display_name
    FROM profiles p
    LEFT JOIN bio_profiles bp ON bp.user_id = p.id
    WHERE p.id = v_user_id
    LIMIT 1;
    
    -- Build result JSON
    SELECT json_build_object(
        'displayName', v_display_name,
        'stats', (
            SELECT json_build_object(
                'totalClicks', COUNT(*),
                'clicksThisWeek', COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
                'clicksLastWeek', COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE - INTERVAL '14 days' AND ce.timestamp < CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
                'clicksThisMonth', COUNT(CASE WHEN ce.timestamp >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)
            )
            FROM click_events ce
            INNER JOIN links l ON ce.link_id = l.id
            WHERE l.user_id = v_user_id
        ),
        'countries', (
            SELECT COALESCE(json_agg(c), '[]'::json)
            FROM (
                SELECT country, COUNT(*) as "clickCount"
                FROM click_events ce
                INNER JOIN links l ON ce.link_id = l.id
                WHERE l.user_id = v_user_id AND country IS NOT NULL
                GROUP BY country
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) c
        ),
        'cities', (
            SELECT COALESCE(json_agg(c), '[]'::json)
            FROM (
                SELECT city, country, COUNT(*) as "clickCount"
                FROM click_events ce
                INNER JOIN links l ON ce.link_id = l.id
                WHERE l.user_id = v_user_id AND city IS NOT NULL
                GROUP BY city, country
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) c
        ),
        'devices', (
            SELECT COALESCE(json_agg(d), '[]'::json)
            FROM (
                SELECT device, COUNT(*) as "clickCount"
                FROM click_events ce
                INNER JOIN links l ON ce.link_id = l.id
                WHERE l.user_id = v_user_id
                GROUP BY device
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) d
        ),
        'browsers', (
            SELECT COALESCE(json_agg(b), '[]'::json)
            FROM (
                SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*) as "clickCount"
                FROM click_events ce
                INNER JOIN links l ON ce.link_id = l.id
                WHERE l.user_id = v_user_id
                GROUP BY browser
                ORDER BY COUNT(*) DESC
                LIMIT 5
            ) b
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Grant execute to anon for public access
GRANT EXECUTE ON FUNCTION get_shared_analytics(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_analytics(TEXT) TO authenticated;

-- RPC function to create a share token (authenticated users only)
CREATE OR REPLACE FUNCTION create_analytics_share_token(p_expires_in_days INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate random token
    v_token := encode(gen_random_bytes(16), 'hex');
    
    -- Calculate expiry if specified
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Insert token
    INSERT INTO analytics_share_tokens (user_id, token, expires_at)
    VALUES (auth.uid(), v_token, v_expires_at);
    
    RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION create_analytics_share_token(INTEGER) TO authenticated;
