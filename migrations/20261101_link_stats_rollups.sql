-- Per-link analytics from the running totals (see 20261101_click_rollups.sql).
--
-- get_link_stats counted the link's raw clicks five times over (total,
-- unique visitors, top country, top city, top referrer) plus a daily
-- series: ~3 s on a 29k-click link, longer on bigger ones. It now reads
-- click_rollups / click_visitors. Same name, guard and output columns.
--
-- top_referrer is now the referrer category ("Google", "Instagram", ...)
-- rather than the raw referrer URL, as the rollups keep categories; the
-- app doesn't display it. Direct visits are left out, as before (the old
-- query skipped empty referrers).
--
-- Needs the rollups to be backfilled (done). Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_link_stats(p_link_id uuid)
RETURNS TABLE(total_clicks bigint, unique_visitors bigint, top_country text, top_city text, top_referrer text, clicks_by_day json)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' AND NOT EXISTS (
        SELECT 1 FROM public.links l
        WHERE l.id = p_link_id
          AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(l.team_id)))
    ) THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT
        (SELECT coalesce(sum(r.clicks), 0) FROM public.click_rollups r
          WHERE r.link_id = p_link_id AND r.dim = 'total')::bigint,
        (SELECT count(*) FROM public.click_visitors v WHERE v.link_id = p_link_id)::bigint,
        (SELECT r.val FROM public.click_rollups r WHERE r.link_id = p_link_id AND r.dim = 'country'
          GROUP BY r.val ORDER BY sum(r.clicks) DESC LIMIT 1),
        (SELECT r.val FROM public.click_rollups r WHERE r.link_id = p_link_id AND r.dim = 'city'
          GROUP BY r.val ORDER BY sum(r.clicks) DESC LIMIT 1),
        (SELECT r.val FROM public.click_rollups r WHERE r.link_id = p_link_id AND r.dim = 'referrer' AND r.val <> 'Direct'
          GROUP BY r.val ORDER BY sum(r.clicks) DESC LIMIT 1),
        (SELECT json_agg(json_build_object('day', d.day, 'count', d.count) ORDER BY d.day)
           FROM (SELECT date(r.bucket) AS day, sum(r.clicks)::bigint AS count
                   FROM public.click_rollups r
                  WHERE r.link_id = p_link_id AND r.dim = 'total'
                    AND r.bucket >= date_trunc('hour', now() - interval '30 days')
                  GROUP BY date(r.bucket)) d);
END;
$$;
