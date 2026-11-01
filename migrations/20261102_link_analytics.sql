-- Everything the link analytics page shows, counted on the server.
--
-- The page loaded up to 50,000 raw click rows (every column) and counted
-- them in the browser: about 50 MB for the largest link (~107k clicks), and
-- on links with more than 50k clicks every chart, "All time" included,
-- covered only the newest 50k. get_link_analytics returns the counts the
-- page draws, for one time range, as a few KB of JSON.
--
-- p_range is '24h', '7d', '30d' or 'all'. p_tz is the viewer's IANA time
-- zone (e.g. 'Asia/Kolkata'); the timeline and the day/hour heatmap are
-- bucketed in it, as the page did with the browser's local time. An
-- unknown zone falls back to UTC.
--
-- Same access rule as get_link_stats: the link's owner, a member of its
-- team, or the service role. Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_link_analytics(p_link_id uuid, p_range text, p_tz text DEFAULT 'UTC')
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    t_now timestamptz := now();
    tz text := coalesce(p_tz, 'UTC');
    span interval;
    starts timestamptz;
    timeline_from timestamptz;
    offset_slots int;
    result json;
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' AND NOT EXISTS (
        SELECT 1 FROM public.links l
        WHERE l.id = p_link_id
          AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(l.team_id)))
    ) THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

    BEGIN
        PERFORM t_now AT TIME ZONE tz;
    EXCEPTION WHEN OTHERS THEN
        tz := 'UTC';
    END;

    span := CASE p_range
        WHEN '24h' THEN interval '24 hours'
        WHEN '7d' THEN interval '7 days'
        WHEN '30d' THEN interval '30 days'
        WHEN 'all' THEN NULL
        ELSE NULL
    END;
    IF p_range IS NULL OR p_range NOT IN ('24h', '7d', '30d', 'all') THEN
        RAISE EXCEPTION 'Unknown range %', p_range USING ERRCODE = '22023';
    END IF;

    starts := CASE WHEN span IS NULL THEN '-infinity'::timestamptz ELSE t_now - span END;
    -- The page charts 24 hours hourly, 7 or 30 days daily, and the last 14
    -- days daily for "All time".
    timeline_from := CASE WHEN span IS NULL THEN t_now - interval '14 days' ELSE starts END;

    IF span IS NULL THEN
        -- All time: from the link's rollups (20261102_rollup_breakdowns.sql),
        -- so the cost doesn't grow with the link's click count. The heatmap
        -- shifts UTC half-hours by the zone's current offset (for zones with
        -- daylight saving, clicks from the other half of the year land an
        -- hour off).
        offset_slots := round(extract(epoch FROM (t_now AT TIME ZONE tz) - (t_now AT TIME ZONE 'UTC')) / 1800)::int;

        WITH r AS MATERIALIZED (
            SELECT ro.dim, ro.val, ro.val2, sum(ro.clicks) AS n
            FROM public.click_rollups ro
            WHERE ro.link_id = p_link_id AND ro.dim <> 'total'
            GROUP BY ro.dim, ro.val, ro.val2
        ),
        -- Device, browser, OS and country rollups keep '' as is; the page shows it as Unknown.
        named AS (
            SELECT dim, coalesce(nullif(val, ''), 'Unknown') AS v, sum(n) AS n
            FROM r WHERE dim IN ('device', 'browser', 'os', 'country', 'referrer_raw', 'device_model', 'screen', 'language', 'timezone')
            GROUP BY 1, 2
        )
        SELECT json_build_object(
            'range', p_range,
            'timezone', tz,
            'total', (SELECT coalesce(sum(clicks), 0) FROM public.click_rollups WHERE link_id = p_link_id AND dim = 'total'),
            'unique', (SELECT count(*) FROM public.click_visitors WHERE link_id = p_link_id),
            'previousTotal', 0,
            'previousUnique', 0,
            'timeline', (
                SELECT coalesce(json_agg(json_build_object('key', k, 'clicks', n) ORDER BY k), '[]'::json)
                FROM (
                    SELECT to_char(ce.timestamp AT TIME ZONE tz, 'YYYY-MM-DD') AS k, count(*) AS n
                    FROM public.click_events ce
                    WHERE ce.link_id = p_link_id AND ce.timestamp > timeline_from AND ce.timestamp <= t_now
                    GROUP BY 1
                ) t
            ),
            'devices', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json) FROM named WHERE dim = 'device'),
            'browsers', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json) FROM named WHERE dim = 'browser'),
            'oses', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json) FROM named WHERE dim = 'os'),
            'countries', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json) FROM named WHERE dim = 'country'),
            'referrers', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                          FROM (SELECT v, n FROM named WHERE dim = 'referrer_raw' ORDER BY n DESC, v LIMIT 5) d),
            'deviceModels', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                             FROM (SELECT v, n FROM named WHERE dim = 'device_model' ORDER BY n DESC, v LIMIT 5) d),
            'screenWidths', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                             FROM (SELECT v, n FROM named WHERE dim = 'screen' ORDER BY n DESC, v LIMIT 3) d),
            'languages', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                          FROM (SELECT v, n FROM named WHERE dim = 'language' ORDER BY n DESC, v LIMIT 5) d),
            'timezones', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                          FROM (SELECT v, n FROM named WHERE dim = 'timezone' ORDER BY n DESC, v LIMIT 5) d),
            'regions', (SELECT coalesce(json_agg(json_build_object('country', val2, 'region', val, 'value', n) ORDER BY n DESC, val2, val), '[]'::json)
                        FROM r WHERE dim = 'region' AND val2 IN ('United States', 'India')),
            'cities', (SELECT coalesce(json_agg(json_build_object('country', val2, 'city', val, 'value', n) ORDER BY n DESC, val2, val), '[]'::json)
                       FROM r WHERE dim = 'city' AND val2 IN ('United States', 'India') AND val <> ''),
            'heatmap', (SELECT coalesce(json_agg(json_build_object('day', dw, 'hour', hr, 'count', n)), '[]'::json)
                        FROM (SELECT ls / 48 AS dw, (ls % 48) / 2 AS hr, sum(n) AS n
                              FROM (SELECT (((val::int + offset_slots) % 336) + 336) % 336 AS ls, n FROM r WHERE dim = 'slot') s
                              GROUP BY 1, 2) h),
            'destinations', (SELECT coalesce(json_agg(json_build_object('url', val, 'clicks', n)), '[]'::json) FROM r WHERE dim = 'destination')
        ) INTO result;
        RETURN result;
    END IF;

    WITH c AS MATERIALIZED (
        SELECT ce.timestamp AS ts,
               ce.visitor_id,
               coalesce(nullif(ce.device, ''), 'Unknown') AS device,
               coalesce(nullif(ce.browser, ''), 'Unknown') AS browser,
               coalesce(nullif(ce.os, ''), 'Unknown') AS os,
               coalesce(nullif(ce.country, ''), 'Unknown') AS country,
               ce.region,
               ce.city,
               coalesce(nullif(ce.referrer, ''), 'Unknown') AS referrer,
               coalesce(nullif(ce.device_model, ''), 'Unknown') AS device_model,
               ce.destination_url,
               coalesce(ce.screen_width::text, 'Unknown') AS screen_width,
               coalesce(nullif(ce.language, ''), 'Unknown') AS language,
               coalesce(nullif(ce.timezone, ''), 'Unknown') AS visitor_tz
        FROM public.click_events ce
        WHERE ce.link_id = p_link_id
          AND ce.timestamp >= starts
          AND ce.timestamp <= t_now
    ),
    prev AS (
        SELECT count(*) AS total, count(DISTINCT ce.visitor_id) AS uniq
        FROM public.click_events ce
        WHERE span IS NOT NULL
          AND ce.link_id = p_link_id
          AND ce.timestamp >= t_now - 2 * span
          AND ce.timestamp < starts
    )
    SELECT json_build_object(
        'range', p_range,
        'timezone', tz,
        'total', (SELECT count(*) FROM c),
        'unique', (SELECT count(DISTINCT visitor_id) FROM c),
        'previousTotal', (SELECT total FROM prev),
        'previousUnique', (SELECT uniq FROM prev),
        -- Keys: 'YYYY-MM-DDTHH' for 24h, 'YYYY-MM-DD' otherwise, in tz.
        'timeline', (
            SELECT coalesce(json_agg(json_build_object('key', k, 'clicks', n) ORDER BY k), '[]'::json)
            FROM (
                SELECT to_char(ts AT TIME ZONE tz, CASE WHEN p_range = '24h' THEN 'YYYY-MM-DD"T"HH24' ELSE 'YYYY-MM-DD' END) AS k,
                       count(*) AS n
                FROM c WHERE span IS NOT NULL OR ts > timeline_from GROUP BY 1
            ) t
        ),
        'devices', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                    FROM (SELECT device AS v, count(*) AS n FROM c GROUP BY 1) d),
        'browsers', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                     FROM (SELECT browser AS v, count(*) AS n FROM c GROUP BY 1) d),
        'oses', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                 FROM (SELECT os AS v, count(*) AS n FROM c GROUP BY 1) d),
        'countries', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                      FROM (SELECT country AS v, count(*) AS n FROM c GROUP BY 1) d),
        'referrers', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                      FROM (SELECT referrer AS v, count(*) AS n FROM c GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 5) d),
        'deviceModels', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                         FROM (SELECT device_model AS v, count(*) AS n FROM c GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 5) d),
        -- State-level counts for the map's USA and India views.
        'regions', (SELECT coalesce(json_agg(json_build_object('country', co, 'region', r, 'value', n) ORDER BY n DESC, co, r), '[]'::json)
                    FROM (SELECT country AS co, region AS r, count(*) AS n FROM c
                          WHERE country IN ('United States', 'India') AND region IS NOT NULL AND region <> ''
                          GROUP BY 1, 2) d),
        'screenWidths', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                         FROM (SELECT screen_width AS v, count(*) AS n FROM c GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 3) d),
        'languages', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                      FROM (SELECT language AS v, count(*) AS n FROM c GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 5) d),
        'timezones', (SELECT coalesce(json_agg(json_build_object('name', v, 'value', n) ORDER BY n DESC, v), '[]'::json)
                      FROM (SELECT visitor_tz AS v, count(*) AS n FROM c GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 5) d),
        -- City counts for the map's markers in the USA and India views.
        -- Most clicked first: the map shows the top 15 it has coordinates for.
        'cities', (SELECT coalesce(json_agg(json_build_object('country', co, 'city', ci, 'value', n) ORDER BY n DESC, co, ci), '[]'::json)
                   FROM (SELECT country AS co, city AS ci, count(*) AS n FROM c
                         WHERE country IN ('United States', 'India') AND city IS NOT NULL AND city <> ''
                         GROUP BY 1, 2) d),
        -- Day of week (0 = Sunday) x hour, in tz.
        'heatmap', (SELECT coalesce(json_agg(json_build_object('day', dw, 'hour', hr, 'count', n)), '[]'::json)
                    FROM (SELECT extract(dow FROM ts AT TIME ZONE tz)::int AS dw,
                                 extract(hour FROM ts AT TIME ZONE tz)::int AS hr,
                                 count(*) AS n
                          FROM c GROUP BY 1, 2) d),
        -- Clicks per A/B destination; null destination counted as 'original'.
        'destinations', (SELECT coalesce(json_agg(json_build_object('url', u, 'clicks', n)), '[]'::json)
                         FROM (SELECT coalesce(destination_url, 'original') AS u, count(*) AS n FROM c GROUP BY 1) d)
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_link_analytics(uuid, text, text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_link_analytics(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_link_analytics(uuid, text, text) TO service_role;
