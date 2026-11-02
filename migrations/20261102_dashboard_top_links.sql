-- Top links for the redesigned dashboard: the caller's 5 most-clicked links
-- over the last p_days, each with clicks per day for the last p_spark_days
-- complete UTC days (today, still partial, is left out of the trend).
-- Reads the hourly click rollups. Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_user_top_links(p_days integer DEFAULT 7, p_spark_days integer DEFAULT 13)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
    days integer := least(greatest(coalesce(p_days, 7), 1), 366);
    spark_days integer := least(greatest(coalesce(p_spark_days, 13), 2), 60);
    today timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    result json;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

    WITH my_links AS (
        SELECT id, title, short_code FROM public.links WHERE user_id = uid AND NOT coalesce(is_archived, false)
    ),
    totals AS (
        SELECT r.link_id, r.bucket, r.clicks
        FROM public.click_rollups r JOIN my_links l ON l.id = r.link_id
        WHERE r.dim = 'total' AND r.bucket >= least(now() - days * interval '1 day', today - spark_days * interval '1 day')
    ),
    top AS (
        SELECT link_id, sum(clicks) AS clicks
        FROM totals WHERE bucket >= date_trunc('hour', now() - days * interval '1 day')
        GROUP BY link_id ORDER BY 2 DESC LIMIT 5
    )
    SELECT coalesce(json_agg(json_build_object(
               'id', l.id, 'title', l.title, 'shortCode', l.short_code, 'clicks', t.clicks,
               'spark', (
                   SELECT json_agg(coalesce(s.n, 0) ORDER BY g.d)
                   FROM generate_series(today - spark_days * interval '1 day', today - interval '1 day', interval '1 day') AS g(d)
                   LEFT JOIN LATERAL (
                       SELECT sum(x.clicks) AS n FROM totals x
                       WHERE x.link_id = l.id AND x.bucket >= g.d AND x.bucket < g.d + interval '1 day'
                   ) s ON true
               ))
           ORDER BY t.clicks DESC), '[]'::json)
    INTO result
    FROM top t JOIN my_links l ON l.id = t.link_id;

    RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_user_top_links(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_top_links(integer, integer) TO authenticated, service_role;
