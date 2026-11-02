-- Drop five click_events indexes nothing uses any more.
--
-- Every click insert updates every index on click_events. These five served
-- the old raw-click analytics (now read from click_rollups) or one-off
-- backfill scripts. Scans in production since stats were reset (2025-11-21):
--   idx_click_events_city            6     20 MB
--   idx_click_events_browser        52     19 MB
--   idx_click_events_country_code  138     19 MB
--   idx_click_events_country       159     19 MB
--   idx_click_events_fingerprint   277    115 MB  (scripts/hash-stored-fingerprints.sql)
-- against ~1.2M inserts. The views counting DISTINCT fingerprint group whole
-- links and don't use the index. Kept: link_id, (link_id, timestamp),
-- timestamp, visitor_id and the primary key, which are all in use.
--
-- Plain DROP INDEX takes a brief lock on click_events (clicks wait, not
-- fail, for a moment). Safe to re-run.

DROP INDEX IF EXISTS public.idx_click_events_city;
DROP INDEX IF EXISTS public.idx_click_events_browser;
DROP INDEX IF EXISTS public.idx_click_events_country_code;
DROP INDEX IF EXISTS public.idx_click_events_country;
DROP INDEX IF EXISTS public.idx_click_events_fingerprint;
