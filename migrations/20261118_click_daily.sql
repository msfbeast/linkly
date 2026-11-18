-- Daily click breakdowns, so Analytics can show countries, cities, devices,
-- systems, browsers, phones and sources for the last 7, 30 or 90 days.
--
-- click_rollups buckets these by month, so they could only be shown for
-- all time; a range filter over raw click_events took ~24s for the largest
-- account. click_daily keeps one row per link, dimension, value and UTC day
-- for the last 100 days (pruned by api/cron/cleanup.ts).
--
-- Order matters: the trigger starts counting first, then the backfill fills
-- in clicks from before that moment. A click inserted in the same instant
-- as the switch-over can be missed or counted twice; that's a handful at
-- most, on one day, in a breakdown that's shown as shares.

BEGIN;

CREATE TABLE IF NOT EXISTS public.click_daily (
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    dim text NOT NULL,
    val text NOT NULL,
    val2 text NOT NULL DEFAULT '',
    day date NOT NULL,
    clicks bigint NOT NULL,
    PRIMARY KEY (link_id, dim, val, val2, day)
);
CREATE INDEX IF NOT EXISTS click_daily_day_idx ON public.click_daily (day);

-- Only reachable through the SECURITY DEFINER functions below.
ALTER TABLE public.click_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.click_daily FROM anon, authenticated;
GRANT ALL ON TABLE public.click_daily TO service_role;

-- The dimensions kept per day (all of them come from click_rollup_rows).
CREATE OR REPLACE FUNCTION public.click_daily_dims()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['country', 'city', 'device', 'os', 'browser', 'referrer', 'model']
$$;
REVOKE ALL ON FUNCTION public.click_daily_dims() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.click_daily_dims() TO service_role;

CREATE OR REPLACE FUNCTION public.count_click_in_rollups()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.link_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('click_rollups:' || NEW.link_id::text, 0));
  END IF;

  INSERT INTO public.click_rollups AS r (link_id, dim, val, val2, bucket, clicks)
  SELECT NEW.link_id, x.dim, x.val, x.val2, x.bucket, 1
  FROM public.click_rollup_rows(NEW) x
  ON CONFLICT (link_id, dim, val, val2, bucket) DO UPDATE SET clicks = r.clicks + 1;

  INSERT INTO public.click_daily AS d (link_id, dim, val, val2, day, clicks)
  SELECT NEW.link_id, x.dim, x.val, x.val2, (NEW.timestamp AT TIME ZONE 'UTC')::date, 1
  FROM public.click_rollup_rows(NEW) x
  WHERE x.dim = ANY (public.click_daily_dims())
  ON CONFLICT (link_id, dim, val, val2, day) DO UPDATE SET clicks = d.clicks + 1;

  IF NEW.link_id IS NOT NULL AND NEW.visitor_id IS NOT NULL THEN
    INSERT INTO public.click_visitors (link_id, visitor_id)
    VALUES (NEW.link_id, NEW.visitor_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$function$;

-- Rebuilding a link's rollups (admin maintenance) rebuilds its daily rows too.
CREATE OR REPLACE FUNCTION public.rebuild_link_rollups(p_link_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  n bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('click_rollups:' || p_link_id::text, 0));

  DELETE FROM public.click_rollups WHERE link_id = p_link_id;

  INSERT INTO public.click_rollups (link_id, dim, val, val2, bucket, clicks)
  SELECT ce.link_id, x.dim, x.val, x.val2, x.bucket, count(*)
  FROM public.click_events ce
  CROSS JOIN LATERAL public.click_rollup_rows(ce) x
  WHERE ce.link_id = p_link_id
  GROUP BY ce.link_id, x.dim, x.val, x.val2, x.bucket;
  GET DIAGNOSTICS n = ROW_COUNT;

  DELETE FROM public.click_daily WHERE link_id = p_link_id;

  INSERT INTO public.click_daily (link_id, dim, val, val2, day, clicks)
  SELECT ce.link_id, x.dim, x.val, x.val2, (ce.timestamp AT TIME ZONE 'UTC')::date, count(*)
  FROM public.click_events ce
  CROSS JOIN LATERAL public.click_rollup_rows(ce) x
  WHERE ce.link_id = p_link_id
    AND ce.timestamp >= now() - interval '100 days'
    AND x.dim = ANY (public.click_daily_dims())
  GROUP BY 1, 2, 3, 4, 5;

  INSERT INTO public.click_visitors (link_id, visitor_id)
  SELECT DISTINCT ce.link_id, ce.visitor_id
  FROM public.click_events ce
  WHERE ce.link_id = p_link_id AND ce.visitor_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  RETURN n;
END;
$function$;

-- Breakdowns of the caller's own links over the last p_days days (1-100),
-- in UTC days, today included. Same shapes as the all-time functions.
CREATE OR REPLACE FUNCTION public.get_user_breakdowns(p_days integer)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  since date := (now() AT TIME ZONE 'UTC')::date - (least(greatest(coalesce(p_days, 30), 1), 100) - 1);
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to see analytics' USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH b AS (
      SELECT d.dim, d.val, d.val2, sum(d.clicks)::bigint AS n
      FROM public.click_daily d
      JOIN public.links l ON l.id = d.link_id
      WHERE l.user_id = uid AND d.day >= since
      GROUP BY d.dim, d.val, d.val2
    ),
    ranked AS (
      SELECT b.*, row_number() OVER (PARTITION BY b.dim ORDER BY b.n DESC, b.val) AS rk FROM b
    )
    SELECT json_build_object(
      'days', least(greatest(coalesce(p_days, 30), 1), 100),
      'countries', coalesce((SELECT json_agg(json_build_object('country', val, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'country' AND rk <= 20), '[]'),
      'cities', coalesce((SELECT json_agg(json_build_object('city', val, 'country', val2, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'city' AND rk <= 20), '[]'),
      'devices', coalesce((SELECT json_agg(json_build_object('device', val, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'device' AND rk <= 10), '[]'),
      'os', coalesce((SELECT json_agg(json_build_object('os', val, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'os' AND rk <= 10), '[]'),
      'browsers', coalesce((SELECT json_agg(json_build_object('browser', val, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'browser' AND rk <= 10), '[]'),
      'referrers', coalesce((SELECT json_agg(json_build_object('referrer', val, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'referrer' AND rk <= 10), '[]'),
      'models', coalesce((SELECT json_agg(json_build_object('model', val, 'clickCount', n) ORDER BY rk) FROM ranked WHERE dim = 'model' AND rk <= 10), '[]')
    )
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.get_user_breakdowns(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_breakdowns(integer) TO authenticated, service_role;

-- Backfill: one month-sized chunk per call, so no single statement runs
-- long. Run until it returns 'done':
--   SELECT public.backfill_click_daily();
CREATE OR REPLACE FUNCTION public.backfill_click_daily()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cutoff timestamptz;
  done_until timestamptz;
  start_at timestamptz := date_trunc('day', now() - interval '100 days');
  chunk_end timestamptz;
  n bigint;
BEGIN
  SELECT at INTO cutoff FROM public.click_rollup_state WHERE key = 'daily_trigger_started';
  IF cutoff IS NULL THEN RAISE EXCEPTION 'click_daily trigger not installed'; END IF;
  SELECT at INTO done_until FROM public.click_rollup_state WHERE key = 'daily_backfilled_until';
  done_until := greatest(coalesce(done_until, start_at), start_at);
  IF done_until >= cutoff THEN RETURN 'done'; END IF;

  chunk_end := least(done_until + interval '20 days', cutoff);

  INSERT INTO public.click_daily AS d (link_id, dim, val, val2, day, clicks)
  SELECT ce.link_id, x.dim, x.val, x.val2, (ce.timestamp AT TIME ZONE 'UTC')::date, count(*)
  FROM public.click_events ce
  CROSS JOIN LATERAL public.click_rollup_rows(ce) x
  WHERE ce.timestamp >= done_until AND ce.timestamp < chunk_end
    AND x.dim = ANY (public.click_daily_dims())
  GROUP BY 1, 2, 3, 4, 5
  ON CONFLICT (link_id, dim, val, val2, day) DO UPDATE SET clicks = d.clicks + EXCLUDED.clicks;
  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.click_rollup_state (key, at) VALUES ('daily_backfilled_until', chunk_end)
  ON CONFLICT (key) DO UPDATE SET at = EXCLUDED.at;

  RETURN to_char(done_until, 'YYYY-MM-DD') || '..' || to_char(chunk_end, 'YYYY-MM-DD') || ': ' || n || ' rows';
END;
$function$;
REVOKE ALL ON FUNCTION public.backfill_click_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_click_daily() TO service_role;

-- The trigger function above is live once this commits; the backfill counts
-- clicks strictly before this moment.
INSERT INTO public.click_rollup_state (key, at) VALUES ('daily_trigger_started', now())
ON CONFLICT (key) DO NOTHING;

COMMIT;
