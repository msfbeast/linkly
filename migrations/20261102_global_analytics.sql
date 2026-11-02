-- Server-side data for Global Analytics' empty panels and the dashboard's
-- week-over-week change.
--
-- Global Analytics built its map, heatmap and recent-clicks panels from each
-- link's clickHistory, which getLinks hasn't loaded since analytics moved to
-- the click rollups, so they were always empty; "vs N last week" was always
-- 0 (get_user_click_stats has no last-week column). DashboardLayout's
-- week-over-week change counted clickHistory too: always 0%.
--
-- get_click_change(team)              this week vs the week before, for the
--                                     caller's personal links or a team's
-- get_user_analytics_extras(days, tz) for the caller's links: this/last week,
--                                     day x hour heatmap for the range in the
--                                     viewer's time zone, the 10 latest
--                                     clicks, and all countries and US/India
--                                     states for the map
-- Safe to re-run.

-- Clicks in [now - 7d, now) and [now - 14d, now - 7d) from hourly totals.
CREATE OR REPLACE FUNCTION public.get_click_change(p_team_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
    result json;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    IF p_team_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.team_members WHERE team_id = p_team_id AND user_id = uid
    ) THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

    SELECT json_build_object(
        'thisWeek', coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= date_trunc('hour', now() - interval '7 days')), 0),
        'lastWeek', coalesce(sum(r.clicks) FILTER (WHERE r.bucket < date_trunc('hour', now() - interval '7 days')), 0)
    ) INTO result
    FROM public.click_rollups r
    JOIN public.links l ON l.id = r.link_id
    WHERE r.dim = 'total'
      AND r.bucket >= date_trunc('hour', now() - interval '14 days')
      AND CASE WHEN p_team_id IS NULL THEN l.user_id = uid AND l.team_id IS NULL
               ELSE l.team_id = p_team_id END;

    RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_click_change(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_click_change(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_user_analytics_extras(p_days integer DEFAULT 30, p_tz text DEFAULT 'UTC')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    uid uuid := auth.uid();
    days integer := least(greatest(coalesce(p_days, 30), 1), 366);
    tz text := coalesce(p_tz, 'UTC');
    result json;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    BEGIN
        PERFORM now() AT TIME ZONE tz;
    EXCEPTION WHEN OTHERS THEN
        tz := 'UTC';
    END;

    WITH my_links AS (
        SELECT id FROM public.links WHERE user_id = uid
    ),
    hours AS (
        SELECT r.bucket, sum(r.clicks) AS clicks
        FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
        WHERE r.dim = 'total' AND r.bucket >= date_trunc('hour', now() - days * interval '1 day')
        GROUP BY r.bucket
    ),
    -- Each UTC hour, in the viewer's local time with that date's offset
    -- (daylight saving included). In zones offset by part of an hour (India
    -- +5:30) an hour of clicks lands in the local hour it starts in.
    local_hours AS (
        SELECT date_trunc('hour', h.bucket AT TIME ZONE tz) AS local_start, h.clicks
        FROM hours h
    ),
    weeks AS (
        SELECT
            coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= date_trunc('hour', now() - interval '7 days')), 0) AS this_week,
            coalesce(sum(r.clicks) FILTER (WHERE r.bucket < date_trunc('hour', now() - interval '7 days')), 0) AS last_week
        FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
        WHERE r.dim = 'total' AND r.bucket >= date_trunc('hour', now() - interval '14 days')
    )
    SELECT json_build_object(
        'thisWeek', (SELECT this_week FROM weeks),
        'lastWeek', (SELECT last_week FROM weeks),
        'heatmap', (
            SELECT coalesce(json_agg(json_build_object('day', dw, 'hour', hr, 'clicks', n)), '[]'::json)
            FROM (
                SELECT extract(dow FROM date_trunc('hour', local_start))::int AS dw,
                       extract(hour FROM date_trunc('hour', local_start))::int AS hr,
                       sum(clicks)::bigint AS n
                FROM local_hours
                GROUP BY 1, 2
            ) t
        ),
        -- Newest first: each link's latest 10 via its (link_id, timestamp)
        -- index, then the latest 10 of those.
        'recent', (
            SELECT coalesce(json_agg(json_build_object(
                       'timestamp', c.timestamp, 'country', c.country, 'city', c.city,
                       'device', c.device, 'os', c.os, 'browser', c.browser, 'referrer', c.referrer)
                   ORDER BY c.timestamp DESC), '[]'::json)
            FROM (
                SELECT ce.* FROM my_links l
                CROSS JOIN LATERAL (
                    SELECT timestamp, country, city, device, os, browser, referrer
                    FROM public.click_events
                    WHERE link_id = l.id
                    ORDER BY timestamp DESC
                    LIMIT 10
                ) ce
                ORDER BY ce.timestamp DESC
                LIMIT 10
            ) c
        ),
        'countries', (
            SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
            FROM (
                SELECT coalesce(nullif(r.val, ''), 'Unknown') AS v, sum(r.clicks) AS n
                FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
                WHERE r.dim = 'country'
                GROUP BY 1
            ) t
        ),
        'regions', (
            SELECT coalesce(json_agg(json_build_object('country', co, 'region', rg, 'value', n) ORDER BY n DESC, co, rg), '[]'::json)
            FROM (
                SELECT r.val2 AS co, r.val AS rg, sum(r.clicks) AS n
                FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
                WHERE r.dim = 'region' AND r.val2 IN ('United States', 'India')
                GROUP BY 1, 2
            ) t
        )
    ) INTO result;

    RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_user_analytics_extras(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_analytics_extras(integer, text) TO authenticated, service_role;
