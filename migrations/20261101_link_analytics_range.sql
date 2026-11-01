-- Everything the link analytics page charts, for one time range, from the
-- server.
--
-- The page used to build its cards, timeline and breakdowns from the raw
-- clicks it downloaded with the link, which the API caps (1,000 rows by
-- default). On a busy link "last 7 days" or "all time" only covered the
-- latest clicks, and the clicks card always showed the all-time total.
--
-- get_link_analytics(link, range) returns, for '24h' | '7d' | '30d' | 'all':
--   total, unique            clicks and distinct visitors in the range
--   previous_total, previous_unique   the same for the period before it
--   hourly                   [{t, c}] hourly click counts for the chart window
--                            (the range; 14 days for 'all')
--   device, browser, os, country, referrer, model, destination
--                            [{name, value}] breakdowns, most first
-- Counts come from one pass over the link's clicks in the range (index on
-- link_id, timestamp); the timeline and previous total from click_rollups.
-- Same access rule as get_link_stats. Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_link_analytics(p_link_id uuid, p_range text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  span interval := CASE p_range WHEN '24h' THEN interval '1 day' WHEN '7d' THEN interval '7 days'
                                 WHEN '30d' THEN interval '30 days' ELSE NULL END;
  since timestamptz := now() - span;                 -- NULL for 'all'
  chart_since timestamptz := now() - coalesce(span, interval '14 days');
  result jsonb;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND NOT EXISTS (
      SELECT 1 FROM public.links l
      WHERE l.id = p_link_id
        AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(l.team_id)))
  ) THEN
      RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  WITH f AS MATERIALIZED (
    SELECT device, browser, os, country, referrer, device_model, destination_url, visitor_id
    FROM public.click_events
    WHERE link_id = p_link_id AND (since IS NULL OR timestamp > since)
  ),
  dist AS (
    SELECT d.dim, d.name, count(*) AS value
    FROM f CROSS JOIN LATERAL (VALUES
      ('device', coalesce(nullif(f.device, ''), 'Unknown')),
      ('browser', coalesce(nullif(f.browser, ''), 'Unknown')),
      ('os', coalesce(nullif(f.os, ''), 'Unknown')),
      ('country', coalesce(nullif(f.country, ''), 'Unknown')),
      ('referrer', coalesce(nullif(f.referrer, ''), 'Unknown')),
      ('model', coalesce(nullif(f.device_model, ''), 'Unknown')),
      ('destination', coalesce(nullif(f.destination_url, ''), 'original'))
    ) AS d(dim, name)
    GROUP BY d.dim, d.name
  ),
  ranked AS (
    SELECT dim, name, value, row_number() OVER (PARTITION BY dim ORDER BY value DESC, name) AS rn
    FROM dist
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM f),
    'unique', (SELECT count(DISTINCT visitor_id) FROM f),
    'previous_total', CASE WHEN since IS NULL THEN 0 ELSE (
        SELECT coalesce(sum(r.clicks), 0) FROM public.click_rollups r
        WHERE r.link_id = p_link_id AND r.dim = 'total'
          AND r.bucket >= date_trunc('hour', since - span) AND r.bucket < date_trunc('hour', since)) END,
    'previous_unique', CASE WHEN since IS NULL THEN 0 ELSE (
        SELECT count(DISTINCT visitor_id) FROM public.click_events
        WHERE link_id = p_link_id AND timestamp > since - span AND timestamp <= since) END,
    'hourly', coalesce((
        SELECT jsonb_agg(jsonb_build_object('t', r.bucket, 'c', r.clicks) ORDER BY r.bucket)
        FROM public.click_rollups r
        WHERE r.link_id = p_link_id AND r.dim = 'total' AND r.bucket >= date_trunc('hour', chart_since)), '[]'::jsonb)
  ) || coalesce((
    SELECT jsonb_object_agg(dim, items) FROM (
      SELECT dim, jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY value DESC, name) AS items
      FROM ranked
      WHERE rn <= CASE WHEN dim IN ('country', 'referrer', 'model') THEN 5 ELSE 20 END
      GROUP BY dim) x), '{}'::jsonb)
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_link_analytics(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_link_analytics(uuid, text) TO authenticated, service_role;
