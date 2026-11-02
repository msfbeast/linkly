-- Bio dashboard analytics from the click rollups.
--
-- getBioAnalytics downloaded every click on every link the user owns,
-- 5 links per request with select('*') and no limit: ~780k rows (400+ MB)
-- on the largest account, past the 100k row cap on its biggest link and
-- the 8 s timeout on others (failed batches were dropped silently).
--
-- Returns the same numbers the dashboard showed, for the signed-in user's
-- links (user_id = auth.uid()):
--   total     all-time clicks
--   daily     clicks per UTC day for the last p_days days
--   devices   all-time clicks by device ('unknown' for none)
--   countries all-time clicks by country as stored (the app normalises names)
--   topLinks  the 5 most-clicked links, all time
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_bio_analytics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
    days integer := least(greatest(coalesce(p_days, 30), 1), 366);
    result json;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

    WITH my_links AS (
        SELECT id, title, short_code FROM public.links WHERE user_id = uid
    ),
    totals AS (
        SELECT r.link_id, r.bucket, r.clicks
        FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
        WHERE r.dim = 'total'
    ),
    per_link AS (
        SELECT link_id, sum(clicks) AS clicks FROM totals GROUP BY link_id
    )
    SELECT json_build_object(
        'total', (SELECT coalesce(sum(clicks), 0) FROM per_link),
        'daily', (
            SELECT coalesce(json_agg(json_build_object('date', d, 'clicks', n) ORDER BY d), '[]'::json)
            FROM (
                SELECT to_char(bucket AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS d, sum(clicks) AS n
                FROM totals
                WHERE bucket >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' - (days - 1) * interval '1 day'
                GROUP BY 1
            ) t
        ),
        'devices', (
            SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
            FROM (
                SELECT CASE WHEN r.val IN ('', 'Unknown') THEN 'unknown' ELSE r.val END AS v, sum(r.clicks) AS n
                FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
                WHERE r.dim = 'device'
                GROUP BY 1
            ) t
        ),
        'countries', (
            SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
            FROM (
                SELECT r.val AS v, sum(r.clicks) AS n
                FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
                WHERE r.dim = 'country'
                GROUP BY 1
            ) t
        ),
        'topLinks', (
            SELECT coalesce(json_agg(json_build_object('title', title, 'shortCode', short_code, 'clicks', clicks) ORDER BY clicks DESC, title), '[]'::json)
            FROM (
                SELECT l.title, l.short_code, coalesce(p.clicks, 0) AS clicks
                FROM my_links l LEFT JOIN per_link p ON p.link_id = l.id
                ORDER BY 3 DESC, 1
                LIMIT 5
            ) t
        )
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bio_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bio_analytics(integer) TO authenticated, service_role;
