-- Part 2 of 20261117_guest_link_limits.sql: only /api/link/guest (service
-- role) may create guest links. Apply AFTER the app version that uses
-- /api/link/guest is deployed; until then the landing page can't shorten
-- links. Safe to re-run.

REVOKE ALL ON FUNCTION public.create_guest_link(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_guest_link(text, text, text) TO service_role;
