-- Drop four old analytics functions nothing calls.
--
-- get_click_trends, get_device_breakdown, get_top_cities and
-- get_traffic_sources predate the get_user_* functions. The app, the API
-- routes and the edge functions don't call them, nothing in the database
-- depends on them, and they still count raw click_events (the full scan
-- the rollups replaced). Their guards already refuse other users' data.
-- Safe to re-run.

DROP FUNCTION IF EXISTS public.get_click_trends(uuid, integer);
DROP FUNCTION IF EXISTS public.get_device_breakdown(uuid);
DROP FUNCTION IF EXISTS public.get_top_cities(uuid, integer);
DROP FUNCTION IF EXISTS public.get_traffic_sources(uuid);
