-- Part 2 of 20261101_unlock_attempt_limit.sql: remove the unlimited,
-- publicly callable unlock_link. Apply AFTER the app version that unlocks
-- through /api/link/unlock is deployed; until then protected links can't
-- be opened. Safe to re-run.

DROP FUNCTION IF EXISTS public.unlock_link(text, text);
