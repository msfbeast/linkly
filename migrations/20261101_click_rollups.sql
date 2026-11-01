-- Running click totals, so dashboard analytics don't scan every click.
--
-- The dashboard's get_user_* functions counted raw click_events rows. On a
-- large account (800k+ clicks) each call read ~600 MB and took ~5 s; the
-- dashboard fires six at once, they hit the 8 s statement timeout, and the
-- page sat on loading placeholders before showing empty charts.
--
-- click_rollups keeps per-link counts, updated by a trigger on every new
-- click:
--   dim 'total'                         hourly buckets (time charts, today/week/month)
--   dims country, city (+country), device, os, browser, referrer (category),
--   model (from the user agent)          monthly buckets (breakdowns)
-- click_visitors keeps each (link, visitor) pair once, for unique visitors.
-- Both go away with their link (ON DELETE CASCADE).
--
-- Rollout:
--   1. Apply this file. From then on every new click is counted.
--   2. Backfill older clicks month by month (each month runs once; the
--      function records what it has done, so re-running is safe):
--        SELECT public.backfill_click_rollups(m::date)
--        FROM generate_series('2023-12-01'::date, date_trunc('month', now()), interval '1 month') m;
--      (run a few months per call if one call would take too long).
--   3. Apply 20261101_click_rollups_part2.sql, which points the analytics
--      functions at the rollups.
--
-- Clicks recorded before the trigger existed are counted by the backfill
-- (timestamp before the cutoff saved here); clicks after it by the trigger.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.click_rollups (
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    dim text NOT NULL,
    val text NOT NULL,
    val2 text NOT NULL DEFAULT '',
    bucket timestamptz NOT NULL,
    clicks bigint NOT NULL,
    PRIMARY KEY (link_id, dim, val, val2, bucket)
);

CREATE TABLE IF NOT EXISTS public.click_visitors (
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    visitor_id text NOT NULL,
    PRIMARY KEY (link_id, visitor_id)
);

-- When the trigger took over, and which months the backfill has done.
CREATE TABLE IF NOT EXISTS public.click_rollup_state (
    key text PRIMARY KEY,
    at timestamptz NOT NULL
);

-- Server-side bookkeeping only: read through the analytics functions.
ALTER TABLE public.click_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_rollup_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.click_rollups, public.click_visitors, public.click_rollup_state FROM PUBLIC, anon, authenticated;

-- The rollup rows one click contributes to. Same categories as the
-- get_user_* functions used on raw clicks.
CREATE OR REPLACE FUNCTION public.click_rollup_rows(ce public.click_events)
RETURNS TABLE (dim text, val text, val2 text, bucket timestamptz)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT d.dim, d.val, d.val2, d.bucket
  FROM (VALUES
    ('total', '', '', date_trunc('hour', ce.timestamp)),
    ('country', coalesce(ce.country, 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('city', ce.city, coalesce(ce.country, 'Unknown'), date_trunc('month', ce.timestamp)),
    ('device', coalesce(ce.device, 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('os', coalesce(ce.os, 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('browser', coalesce(ce.browser, 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('referrer',
      CASE
        WHEN ce.referrer IS NULL OR ce.referrer = '' THEN 'Direct'
        WHEN ce.referrer LIKE '%google%' THEN 'Google'
        WHEN ce.referrer LIKE '%facebook%' OR ce.referrer LIKE '%fb.%' THEN 'Facebook'
        WHEN ce.referrer LIKE '%twitter%' OR ce.referrer LIKE '%t.co%' THEN 'Twitter/X'
        WHEN ce.referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN ce.referrer LIKE '%linkedin%' THEN 'LinkedIn'
        WHEN ce.referrer LIKE '%youtube%' THEN 'YouTube'
        WHEN ce.referrer LIKE '%whatsapp%' THEN 'WhatsApp'
        WHEN ce.referrer LIKE '%telegram%' OR ce.referrer LIKE '%t.me%' THEN 'Telegram'
        ELSE 'Other'
      END, '', date_trunc('month', ce.timestamp)),
    ('model',
      CASE
        WHEN ce.raw_user_agent ILIKE '%iPhone%' THEN
          CASE
            WHEN ce.raw_user_agent ~ 'iPhone17,[1-4]' THEN 'iPhone 15 Series'
            WHEN ce.raw_user_agent ~ 'iPhone16,[1-2]' OR ce.raw_user_agent ~ 'iPhone15,[2-5]' THEN 'iPhone 14 Series'
            WHEN ce.raw_user_agent ~ 'iPhone14,[2-5]' THEN 'iPhone 13 Series'
            WHEN ce.raw_user_agent ~ 'iPhone13,[1-4]' THEN 'iPhone 12 Series'
            WHEN ce.raw_user_agent ~ 'iPhone12,[1-8]' THEN 'iPhone 11 Series'
            ELSE 'iPhone (Other)'
          END
        WHEN ce.raw_user_agent ILIKE '%iPad%' THEN 'iPad'
        WHEN ce.raw_user_agent ~ 'SM-S9[12][0-9]' THEN 'Galaxy S24 Series'
        WHEN ce.raw_user_agent ~ 'SM-S91[0-9]' THEN 'Galaxy S23 Series'
        WHEN ce.raw_user_agent ~ 'SM-S90[0-9]' THEN 'Galaxy S22 Series'
        WHEN ce.raw_user_agent ~ 'SM-A5[0-9]' THEN 'Galaxy A50/A55 Series'
        WHEN ce.raw_user_agent ~ 'SM-A3[0-9]' THEN 'Galaxy A30 Series'
        WHEN ce.raw_user_agent ~ 'SM-A1[0-9]' THEN 'Galaxy A10 Series'
        WHEN ce.raw_user_agent ILIKE '%SM-%' THEN 'Samsung (Other)'
        WHEN ce.raw_user_agent ILIKE '%OnePlus%' THEN 'OnePlus'
        WHEN ce.raw_user_agent ILIKE '%Redmi%' THEN 'Redmi'
        WHEN ce.raw_user_agent ILIKE '%Xiaomi%' THEN 'Xiaomi'
        WHEN ce.raw_user_agent ILIKE '%Pixel%' THEN 'Google Pixel'
        WHEN ce.raw_user_agent ILIKE '%Windows NT%' THEN 'Windows PC'
        WHEN ce.raw_user_agent ILIKE '%Macintosh%' THEN 'Mac'
        WHEN ce.raw_user_agent ILIKE '%Linux%' AND ce.raw_user_agent NOT ILIKE '%Android%' THEN 'Linux PC'
        WHEN ce.raw_user_agent ILIKE '%Android%' THEN 'Android (Other)'
        ELSE 'Unknown'
      END, '', date_trunc('month', ce.timestamp))
  ) AS d(dim, val, val2, bucket)
  WHERE ce.link_id IS NOT NULL
    AND ce.timestamp IS NOT NULL
    AND d.val IS NOT NULL;            -- clicks without a city skip the city dim, as before
$$;

CREATE OR REPLACE FUNCTION public.count_click_in_rollups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.click_rollups AS r (link_id, dim, val, val2, bucket, clicks)
  SELECT NEW.link_id, x.dim, x.val, x.val2, x.bucket, 1
  FROM public.click_rollup_rows(NEW) x
  ON CONFLICT (link_id, dim, val, val2, bucket) DO UPDATE SET clicks = r.clicks + 1;

  IF NEW.link_id IS NOT NULL AND NEW.visitor_id IS NOT NULL THEN
    INSERT INTO public.click_visitors (link_id, visitor_id)
    VALUES (NEW.link_id, NEW.visitor_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS count_click_in_rollups ON public.click_events;
CREATE TRIGGER count_click_in_rollups
  AFTER INSERT ON public.click_events
  FOR EACH ROW EXECUTE FUNCTION public.count_click_in_rollups();

-- Clicks before this moment are the backfill's; after it, the trigger's.
INSERT INTO public.click_rollup_state (key, at) VALUES ('trigger_started', clock_timestamp())
ON CONFLICT (key) DO NOTHING;

-- Adds one month of pre-trigger clicks to the rollups. Each month is done
-- once (recorded in click_rollup_state), so re-running is safe.
CREATE OR REPLACE FUNCTION public.backfill_click_rollups(p_month date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz;
  m_start timestamptz := date_trunc('month', p_month::timestamptz);
  m_key text := 'backfilled:' || to_char(m_start, 'YYYY-MM');
  n bigint;
BEGIN
  SELECT at INTO cutoff FROM public.click_rollup_state WHERE key = 'trigger_started';
  IF cutoff IS NULL THEN RAISE EXCEPTION 'Rollup trigger not installed'; END IF;
  IF m_start > cutoff THEN RETURN m_key || ': after cutoff, nothing to do'; END IF;

  -- Claim the month first: a concurrent or repeated run then fails on the key.
  INSERT INTO public.click_rollup_state (key, at) VALUES (m_key, clock_timestamp())
  ON CONFLICT (key) DO NOTHING;
  IF NOT FOUND THEN RETURN m_key || ': already done'; END IF;

  INSERT INTO public.click_rollups AS r (link_id, dim, val, val2, bucket, clicks)
  SELECT ce.link_id, x.dim, x.val, x.val2, x.bucket, count(*)
  FROM public.click_events ce
  CROSS JOIN LATERAL public.click_rollup_rows(ce) x
  WHERE ce.timestamp >= m_start
    AND ce.timestamp < m_start + interval '1 month'
    AND ce.timestamp < cutoff
  GROUP BY ce.link_id, x.dim, x.val, x.val2, x.bucket
  ON CONFLICT (link_id, dim, val, val2, bucket) DO UPDATE SET clicks = r.clicks + EXCLUDED.clicks;
  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.click_visitors (link_id, visitor_id)
  SELECT DISTINCT link_id, visitor_id FROM public.click_events
  WHERE timestamp >= m_start AND timestamp < m_start + interval '1 month' AND timestamp < cutoff
    AND link_id IS NOT NULL AND visitor_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  RETURN m_key || ': ' || n || ' rollup rows';
END;
$$;

REVOKE ALL ON FUNCTION public.click_rollup_rows(public.click_events) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.count_click_in_rollups() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.backfill_click_rollups(date) FROM PUBLIC, anon, authenticated;
