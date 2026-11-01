-- Clicks and bio views are counted only by the server.
--
-- Anyone with the public anon key could insert rows into click_events
-- (policy WITH CHECK (true)) and call increment_clicks /
-- increment_link_clicks / increment_bio_view(s) directly, inflating any
-- link's clicks or any profile's views. The app now records clicks through
-- /api/track and /r/ and bio views through /api/bio-view, all with the
-- service role and a per-visitor rate limit (api/_lib/countLimit.ts).
--
-- Apply AFTER the app version that uses /api/bio-view is deployed, or bio
-- views stop counting until it is. Safe to re-run.

-- click_events: no direct inserts from browsers.
DROP POLICY IF EXISTS "Anyone can insert click events" ON public.click_events;
REVOKE INSERT ON TABLE public.click_events FROM anon, authenticated;

-- clicks: legacy table, nothing writes to it any more.
DROP POLICY IF EXISTS "Public can record clicks" ON public.clicks;
REVOKE INSERT ON TABLE public.clicks FROM anon, authenticated;

-- Counter functions: server only.
REVOKE ALL ON FUNCTION public.increment_clicks(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_link_clicks(uuid, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_bio_view(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_bio_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_clicks(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(uuid, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_bio_view(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_bio_views(uuid) TO service_role;
