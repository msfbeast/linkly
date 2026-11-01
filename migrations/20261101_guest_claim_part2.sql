-- Part 2 of 20261101_guest_claim.sql: drop the old update_guest_link_metadata,
-- which let anyone set the email on any guest link. Apply AFTER the app
-- version that passes the guest session id is deployed; until then guest
-- emails from the landing page aren't saved. Safe to re-run.

DROP FUNCTION IF EXISTS public.update_guest_link_metadata(uuid, text);
