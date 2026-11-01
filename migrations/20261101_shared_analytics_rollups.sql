-- Shared analytics page from the running click totals.
--
-- get_shared_analytics counted the account's raw clicks five times (stats,
-- countries, cities, devices, browsers). On the largest account (~780k
-- clicks) each pass reads every click, the same work that made the
-- dashboard hit the 8 s statement timeout before the rollups
-- (20261101_click_rollups.sql). It now reads click_rollups.
--
-- Same name, argument, token check and JSON shape. The week/month windows
-- start at midnight (CURRENT_DATE - n days), which falls on an hourly bucket
-- boundary, so the hourly 'total' buckets give the same counts.
-- Differences: clicks with no device are listed as 'Unknown' rather than
-- under a null name, and with tied counts at a top-N cutoff a different
-- value of the same count can take the last place.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_shared_analytics(p_share_token text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_user_id uuid;
    v_display_name text;
    v_result json;
BEGIN
    SELECT user_id INTO v_user_id
    FROM analytics_share_tokens
    WHERE token = p_share_token
      AND (expires_at IS NULL OR expires_at > now());

    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT coalesce(bp.display_name, p.full_name, 'User') INTO v_display_name
    FROM profiles p
    LEFT JOIN bio_profiles bp ON bp.user_id = p.id
    WHERE p.id = v_user_id
    LIMIT 1;

    SELECT json_build_object(
        'displayName', v_display_name,
        'stats', (
            SELECT json_build_object(
                'totalClicks', coalesce(sum(r.clicks), 0),
                'clicksThisWeek', coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= CURRENT_DATE - interval '7 days'), 0),
                'clicksLastWeek', coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= CURRENT_DATE - interval '14 days' AND r.bucket < CURRENT_DATE - interval '7 days'), 0),
                'clicksThisMonth', coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= CURRENT_DATE - interval '30 days'), 0)
            )
            FROM click_rollups r
            JOIN links l ON l.id = r.link_id
            WHERE l.user_id = v_user_id AND r.dim = 'total'
        ),
        'countries', (
            SELECT coalesce(json_agg(c), '[]'::json)
            FROM (SELECT b.val AS country, b.click_count AS "clickCount"
                  FROM user_rollup_breakdown(v_user_id, 'country', 10) b) c
        ),
        'cities', (
            SELECT coalesce(json_agg(c), '[]'::json)
            FROM (SELECT b.val AS city, b.val2 AS country, b.click_count AS "clickCount"
                  FROM user_rollup_breakdown(v_user_id, 'city', 10) b) c
        ),
        'devices', (
            SELECT coalesce(json_agg(d), '[]'::json)
            FROM (SELECT b.val AS device, b.click_count AS "clickCount"
                  FROM user_rollup_breakdown(v_user_id, 'device', 5) b) d
        ),
        'browsers', (
            SELECT coalesce(json_agg(br), '[]'::json)
            FROM (SELECT b.val AS browser, b.click_count AS "clickCount"
                  FROM user_rollup_breakdown(v_user_id, 'browser', 5) b) br
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;
