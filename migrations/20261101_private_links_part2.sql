-- Part 2 of 2: links are no longer world-readable.
--
-- Removes the five policies that let anyone with the public anon key read
-- every link and every column (see 20261101_private_links.sql). Visitors
-- now read links only through get_public_link / get_public_links /
-- get_guest_link_by_claim_token / unlock_link.
--
-- Apply AFTER the app version that uses those functions is deployed, or
-- the redirect page and bio pages can't load links until it is.
-- Safe to re-run.

DROP POLICY IF EXISTS "Anyone can read links by short_code" ON public.links;
DROP POLICY IF EXISTS "Anyone can read links for redirect" ON public.links;
DROP POLICY IF EXISTS "Public links are viewable by everyone" ON public.links;
DROP POLICY IF EXISTS "Allow public read access to guest links" ON public.links;
DROP POLICY IF EXISTS "Public can read guest links" ON public.links;
