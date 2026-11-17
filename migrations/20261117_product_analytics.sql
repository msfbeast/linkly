-- Store page views per day, and product analytics for the owner.
--
-- bio_profiles.views is a running total, so views over a period (and
-- clicks per view) couldn't be shown. increment_bio_view, which only
-- /api/bio-view can call, now also counts the view in bio_view_daily.
-- Days before this was applied have no daily views.
--
-- get_product_analytics(p_days) returns, for the signed-in user:
--   views        store page views in the period (from bio_view_daily)
--   viewsAllTime bio_profiles.views
--   clicks       clicks on product short links in the period
--   clicksAllTime
--   daily        [{date, views, clicks}] for every UTC day in the period
--   products     [{id, clicks, clicksAllTime}] for every product with a short link
-- Product clicks come from the click rollups and include clicks on a
-- product's short link from anywhere, not only from the store page.
--
-- Additive (one table, one new function, increment_bio_view keeps its
-- signature). Safe to re-run.

CREATE TABLE IF NOT EXISTS public.bio_view_daily (
    profile_id uuid NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
    day date NOT NULL,
    views integer NOT NULL DEFAULT 0,
    CONSTRAINT bio_view_daily_pkey PRIMARY KEY (profile_id, day)
);

-- Server-side bookkeeping: read through get_product_analytics only.
ALTER TABLE public.bio_view_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bio_view_daily FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_bio_view(profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    UPDATE public.bio_profiles
    SET views = COALESCE(views, 0) + 1
    WHERE id = increment_bio_view.profile_id;

    IF FOUND THEN
        INSERT INTO public.bio_view_daily AS d (profile_id, day, views)
        VALUES (increment_bio_view.profile_id, (now() AT TIME ZONE 'UTC')::date, 1)
        ON CONFLICT ON CONSTRAINT bio_view_daily_pkey
        DO UPDATE SET views = d.views + 1;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_analytics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid uuid := auth.uid();
    days integer := least(greatest(coalesce(p_days, 30), 1), 366);
    first_day date := (now() AT TIME ZONE 'UTC')::date - (least(greatest(coalesce(p_days, 30), 1), 366) - 1);
    since timestamptz := ((now() AT TIME ZONE 'UTC')::date - (least(greatest(coalesce(p_days, 30), 1), 366) - 1))::timestamp AT TIME ZONE 'UTC';
    result json;
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

    WITH profiles AS (
        SELECT id, views FROM public.bio_profiles WHERE user_id = uid
    ),
    view_days AS (
        SELECT v.day, sum(v.views) AS views
        FROM public.bio_view_daily v JOIN profiles p ON p.id = v.profile_id
        WHERE v.day >= first_day
        GROUP BY v.day
    ),
    product_links AS (
        SELECT DISTINCT id, link_id FROM public.products
        WHERE user_id = uid AND link_id IS NOT NULL AND coalesce(type, 'physical') <> 'digital'
    ),
    link_totals AS (
        SELECT r.link_id, r.bucket, r.clicks
        FROM public.click_rollups r
        WHERE r.dim = 'total' AND r.link_id IN (SELECT link_id FROM product_links)
    ),
    per_link AS (
        SELECT link_id,
               sum(clicks) FILTER (WHERE bucket >= since) AS clicks,
               sum(clicks) AS clicks_all
        FROM link_totals GROUP BY link_id
    ),
    click_days AS (
        SELECT (bucket AT TIME ZONE 'UTC')::date AS day, sum(clicks) AS clicks
        FROM link_totals WHERE bucket >= since
        GROUP BY 1
    )
    SELECT json_build_object(
        'days', days,
        'views', (SELECT coalesce(sum(views), 0) FROM view_days),
        'viewsAllTime', (SELECT coalesce(sum(views), 0) FROM profiles),
        'clicks', (SELECT coalesce(sum(clicks), 0) FROM click_days),
        'clicksAllTime', (SELECT coalesce(sum(clicks_all), 0) FROM per_link),
        'daily', (
            SELECT json_agg(json_build_object(
                       'date', to_char(g.day, 'YYYY-MM-DD'),
                       'views', coalesce(v.views, 0),
                       'clicks', coalesce(c.clicks, 0)) ORDER BY g.day)
            FROM generate_series(first_day, (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS g(day)
            LEFT JOIN view_days v ON v.day = g.day::date
            LEFT JOIN click_days c ON c.day = g.day::date
        ),
        'products', (
            SELECT coalesce(json_agg(json_build_object(
                       'id', pl.id,
                       'clicks', coalesce(l.clicks, 0),
                       'clicksAllTime', coalesce(l.clicks_all, 0)) ORDER BY coalesce(l.clicks, 0) DESC), '[]'::json)
            FROM product_links pl LEFT JOIN per_link l ON l.link_id = pl.link_id
        )
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_product_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_product_analytics(integer) TO authenticated, service_role;
