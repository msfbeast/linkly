-- Links are no longer world-readable.
--
-- Five SELECT policies (three USING (true), two for every guest link) let
-- anyone with the public anon key download every link with every column:
-- private destinations, the plaintext link passwords (password_hash held
-- the raw password and the redirect page compared it in the browser),
-- guest emails in metadata, and guest claim tokens.
--
-- Now:
-- * Owners read their own links (unchanged), team members their team's
--   links, admins all links (the admin dashboard counts them).
-- * Everyone else goes through get_public_link / get_public_links /
--   get_guest_link_by_claim_token, which return a safe projection: no
--   password, claim token, session id or guest email, and no destination
--   at all while a link is password-protected, expired, not yet started or
--   at its click limit.
-- * unlock_link checks a password on the server and only then returns the
--   destination. Passwords are stored as bcrypt hashes (trigger below).
-- * Products whose URL lived only on their link get it copied over, since
--   visitors can no longer read it through the products -> links join.
--
-- Part 1 of 2, additive: apply BEFORE deploying the app version that uses
-- these functions. Part 2 (20261101_private_links_part2.sql) removes the
-- public read policies and goes AFTER that deploy. Safe to re-run.

-- 1. Password hashing --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hash_link_password()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.password_hash = '' THEN
    NEW.password_hash := NULL;
  ELSIF NEW.password_hash IS NOT NULL AND NEW.password_hash !~ '^\$2[aby]\$\d\d\$' THEN
    -- Not hashed yet (new or changed password). Already-hashed values are
    -- kept, so saving a link without touching its password keeps it.
    NEW.password_hash := extensions.crypt(NEW.password_hash, extensions.gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hash_link_password ON public.links;
CREATE TRIGGER hash_link_password
  BEFORE INSERT OR UPDATE OF password_hash ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.hash_link_password();

-- Hash existing plaintext passwords (the trigger does the work).
UPDATE public.links SET password_hash = password_hash
WHERE password_hash IS NOT NULL AND password_hash !~ '^\$2[aby]\$\d\d\$';

-- 2. Safe public projection --------------------------------------------------

CREATE OR REPLACE FUNCTION public.link_public_json(l public.links)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN s.gated
    THEN s.base || jsonb_build_object(
      'original_url', '', 'smart_redirects', NULL, 'geo_redirects', NULL,
      'ab_test_config', NULL, 'metadata', '{}'::jsonb)
    ELSE s.base END
  FROM (
    SELECT
      (to_jsonb(l) - 'password_hash' - 'claim_token' - 'guest_session_id' - 'ai_analysis')
        || jsonb_build_object(
             'metadata', coalesce(l.metadata, '{}'::jsonb) - 'guest_email' - 'guest_session_id',
             'requires_password', coalesce(l.password_hash, '') <> '') AS base,
      (coalesce(l.password_hash, '') <> ''
        OR (l.expiration_date IS NOT NULL AND l.expiration_date < now())
        OR (l.start_date IS NOT NULL AND l.start_date > (extract(epoch FROM now()) * 1000)::bigint)
        OR (l.max_clicks IS NOT NULL AND coalesce(l.clicks, 0) >= l.max_clicks)) AS gated
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.get_public_link(p_short_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.link_public_json(l) FROM public.links l
  WHERE l.short_code = p_short_code
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_links(p_ids uuid[])
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.link_public_json(l) FROM public.links l
  WHERE l.id = ANY (p_ids[1:500]);
$$;

CREATE OR REPLACE FUNCTION public.get_guest_link_by_claim_token(p_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.link_public_json(l) FROM public.links l
  WHERE l.is_guest AND l.claim_token IS NOT NULL AND l.claim_token = p_token
  LIMIT 1;
$$;

-- Destination of a password-protected link, only with the right password.
-- Expiry, start date and click limit still apply after unlocking.
CREATE OR REPLACE FUNCTION public.unlock_link(p_short_code text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  l public.links;
  out jsonb;
BEGIN
  SELECT * INTO l FROM public.links
  WHERE short_code = p_short_code
  LIMIT 1;
  IF NOT FOUND OR coalesce(l.password_hash, '') = '' OR p_password IS NULL
     OR extensions.crypt(p_password, l.password_hash) <> l.password_hash THEN
    RETURN NULL;
  END IF;
  l.password_hash := NULL;              -- unlocked: project as unprotected
  out := public.link_public_json(l);
  RETURN out || jsonb_build_object('requires_password', true);
END;
$$;

REVOKE ALL ON FUNCTION public.link_public_json(public.links) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.hash_link_password() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_public_link(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_links(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_guest_link_by_claim_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlock_link(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_link(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_links(uuid[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_guest_link_by_claim_token(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlock_link(text, text) TO anon, authenticated, service_role;

-- 3. Products keep their own URL ---------------------------------------------

CREATE OR REPLACE FUNCTION public.fill_product_url_from_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(NEW.original_url, '') = '' AND NEW.link_id IS NOT NULL THEN
    SELECT original_url INTO NEW.original_url FROM public.links WHERE id = NEW.link_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.fill_product_url_from_link() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS fill_product_url_from_link ON public.products;
CREATE TRIGGER fill_product_url_from_link
  BEFORE INSERT OR UPDATE OF original_url, link_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.fill_product_url_from_link();

UPDATE public.products p SET original_url = l.original_url
FROM public.links l
WHERE l.id = p.link_id AND coalesce(p.original_url, '') = '';

-- 4. Read access for teams and admins (until now covered by USING (true)) ----

DROP POLICY IF EXISTS "Team members can view team links" ON public.links;
CREATE POLICY "Team members can view team links" ON public.links
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id));

DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
CREATE POLICY "Admins can view all links" ON public.links
  FOR SELECT TO authenticated
  USING (public.current_profile_role() IN ('admin', 'super_admin'));
