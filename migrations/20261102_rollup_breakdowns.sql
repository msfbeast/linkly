-- More breakdowns in the click rollups, for the link analytics page.
--
-- get_link_analytics (20261102_link_analytics.sql) counts raw clicks for the
-- 24h / 7d / 30d views. "All time" on the largest links would read every raw
-- click: ~107k rows scattered over ~39k pages of an 800 MB table, 4 to 25 s
-- on production (past the 8 s statement timeout when cold). With these
-- breakdowns it reads only the link's rollups.
--
-- New monthly dims: referrer_raw (the referrer as stored, not its category),
-- device_model, region (+country), screen, language, timezone, destination
-- (A/B test URL) and slot (half-hour of the week in UTC, for the heatmap).
-- Existing dims and the functions reading them are unchanged.
--
-- Rollout:
--   1. Apply this file. New clicks get the new dims from then on.
--   2. Rebuild in batches until it reports 0 left (clicks on the batch's
--      links wait, not fail, until it commits):
--        SELECT public.rebuild_click_rollups(20);
--
-- rebuild_link_rollups now also adds any (link, visitor) pair missing from
-- click_visitors, so a rebuilt link's unique count is complete.
-- Safe to re-run; a link rebuilt for this version is skipped.

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
        WHEN ce.referrer IS NULL OR ce.referrer = '' OR lower(ce.referrer) = 'direct' THEN 'Direct'
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
      END, '', date_trunc('month', ce.timestamp)),
    -- For the link analytics page's "All time" view (get_link_analytics).
    -- Missing values are stored as 'Unknown' (as the page shows them);
    -- URLs are capped at 500 characters to stay well inside index limits.
    ('referrer_raw', coalesce(nullif(left(ce.referrer, 500), ''), 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('device_model', coalesce(nullif(ce.device_model, ''), 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('region', nullif(ce.region, ''), coalesce(nullif(ce.country, ''), 'Unknown'), date_trunc('month', ce.timestamp)),
    ('screen', coalesce(ce.screen_width::text, 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('language', coalesce(nullif(ce.language, ''), 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('timezone', coalesce(nullif(ce.timezone, ''), 'Unknown'), '', date_trunc('month', ce.timestamp)),
    ('destination', coalesce(left(ce.destination_url, 500), 'original'), '', date_trunc('month', ce.timestamp)),
    -- Half-hour of the week in UTC (0 = Sunday 00:00-00:30), for the heatmap.
    ('slot',
      (extract(dow FROM ce.timestamp AT TIME ZONE 'UTC')::int * 48
       + extract(hour FROM ce.timestamp AT TIME ZONE 'UTC')::int * 2
       + extract(minute FROM ce.timestamp AT TIME ZONE 'UTC')::int / 30)::text,
      '', date_trunc('month', ce.timestamp))
  ) AS d(dim, val, val2, bucket)
  WHERE ce.link_id IS NOT NULL
    AND ce.timestamp IS NOT NULL
    AND d.val IS NOT NULL;            -- clicks without a city skip the city dim, as before
$$;

-- Recompute one link's rollups from its raw clicks (see
-- 20261101_direct_referrer_rollups.sql for the locking).
CREATE OR REPLACE FUNCTION public.rebuild_link_rollups(p_link_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.click_visitors (link_id, visitor_id)
  SELECT DISTINCT ce.link_id, ce.visitor_id
  FROM public.click_events ce
  WHERE ce.link_id = p_link_id AND ce.visitor_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  RETURN n;
END;
$$;

-- Rebuild up to p_batch links not yet rebuilt with these dims; reports how
-- many are left.
CREATE OR REPLACE FUNCTION public.rebuild_click_rollups(p_batch integer DEFAULT 50)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  done integer := 0;
  left_over bigint;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'Run rebuild_click_rollups in READ COMMITTED';
  END IF;

  FOR l IN
    SELECT k.id FROM public.links k
    WHERE NOT EXISTS (SELECT 1 FROM public.click_rollup_state s
                      WHERE s.key = 'rebuilt_v2:' || k.id)
    ORDER BY k.id
    LIMIT p_batch
  LOOP
    PERFORM public.rebuild_link_rollups(l.id);
    INSERT INTO public.click_rollup_state (key, at)
    VALUES ('rebuilt_v2:' || l.id, clock_timestamp())
    ON CONFLICT (key) DO NOTHING;
    done := done + 1;
  END LOOP;

  SELECT count(*) INTO left_over FROM public.links k
  WHERE NOT EXISTS (SELECT 1 FROM public.click_rollup_state s
                    WHERE s.key = 'rebuilt_v2:' || k.id);

  RETURN 'rebuilt ' || done || ' links, ' || left_over || ' left';
END;
$$;

-- The first rebuild's progress markers are no longer used.
DELETE FROM public.click_rollup_state WHERE key LIKE 'rebuilt_direct_referrer:%';

REVOKE ALL ON FUNCTION public.click_rollup_rows(public.click_events) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rebuild_link_rollups(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rebuild_click_rollups(integer) FROM PUBLIC, anon, authenticated;
