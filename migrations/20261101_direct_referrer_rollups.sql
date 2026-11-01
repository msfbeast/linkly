-- Count direct clicks as Direct, and rebuild the click rollups from the raw
-- clicks so past direct clicks move out of Other.
--
-- storeClick saves a click with no referrer as the literal 'direct'
-- (lowercase), but the referrer categories only treated NULL or '' as
-- Direct. Every direct click since Nov 2025 landed in 'Other', which the
-- dashboard's traffic-source chart then shows as Referral. The old raw-click
-- functions had the same CASE; the rollups (20261101_click_rollups.sql) keep
-- only the category, so 'Other' now mixes real other sites with direct
-- clicks and fixing the CASE alone would only correct new clicks.
--
-- This file:
--   1. treats 'direct' (any case) as Direct for new clicks;
--   2. makes the rollup trigger take a per-link lock, so a link's rollups can
--      be rebuilt while clicks keep arriving;
--   3. adds rebuild_link_rollups(link) and rebuild_click_rollups(batch),
--      which recompute a link's rollups from its raw clicks.
--
-- Rollout:
--   1. Apply this file.
--   2. Rebuild in batches until it reports 0 left:
--        SELECT public.rebuild_click_rollups(50);
--      Each batch holds its links' locks until it commits, so clicks on those
--      links wait (not fail) for that long. Keep batches small.
--
-- The rebuild also clears any clicks counted twice around the rollup cutoff
-- (a click from before the cutoff that the queue inserted after the trigger
-- went live was counted by both the trigger and the backfill).
-- click_visitors is not touched; it only ever holds distinct pairs.
--
-- Safe to re-run; a link that has been rebuilt is skipped.

-- Same as before, except the first referrer branch.
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
      END, '', date_trunc('month', ce.timestamp))
  ) AS d(dim, val, val2, bucket)
  WHERE ce.link_id IS NOT NULL
    AND ce.timestamp IS NOT NULL
    AND d.val IS NOT NULL;            -- clicks without a city skip the city dim, as before
$$;

-- Same as before, plus the per-link lock. Every click on a link already
-- updates that link's hourly 'total' row, so clicks on one link were
-- serialised anyway; the lock adds no new waiting between clicks.
CREATE OR REPLACE FUNCTION public.count_click_in_rollups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.link_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('click_rollups:' || NEW.link_id::text, 0));
  END IF;

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

-- Recompute one link's rollups from its raw clicks.
--
-- Takes the link's lock first. A click whose trigger already ran has
-- committed by then (the trigger holds the lock until its transaction ends),
-- so the raw read below sees it; a click whose trigger is still waiting adds
-- itself after this commits. Either way each click is counted once.
-- Must run in READ COMMITTED (the default) so the reads after the lock see
-- clicks that committed while it waited.
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
  RETURN n;
END;
$$;

-- Rebuild up to p_batch links not yet rebuilt; reports how many are left.
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
                      WHERE s.key = 'rebuilt_direct_referrer:' || k.id)
    ORDER BY k.id
    LIMIT p_batch
  LOOP
    PERFORM public.rebuild_link_rollups(l.id);
    INSERT INTO public.click_rollup_state (key, at)
    VALUES ('rebuilt_direct_referrer:' || l.id, clock_timestamp())
    ON CONFLICT (key) DO NOTHING;
    done := done + 1;
  END LOOP;

  SELECT count(*) INTO left_over FROM public.links k
  WHERE NOT EXISTS (SELECT 1 FROM public.click_rollup_state s
                    WHERE s.key = 'rebuilt_direct_referrer:' || k.id);

  RETURN 'rebuilt ' || done || ' links, ' || left_over || ' left';
END;
$$;

REVOKE ALL ON FUNCTION public.click_rollup_rows(public.click_events) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.count_click_in_rollups() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rebuild_link_rollups(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rebuild_click_rollups(integer) FROM PUBLIC, anon, authenticated;
