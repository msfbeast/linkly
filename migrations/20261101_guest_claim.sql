-- Make guest link claiming work, and stop strangers setting guest emails.
--
-- Claiming never worked:
-- * create_guest_link never set a claim token, so no guest link had one;
-- * claim_guest_link compared links.claim_token (varchar) with a uuid
--   parameter, which fails with "operator does not exist";
-- * the app claimed by updating the links table directly, which RLS has
--   refused since the links lockdown.
-- Now create_guest_link sets a random claim token and returns it to the
-- browser that made the link (the public projection never shows it), and
-- the app claims through claim_guest_link.
--
-- update_guest_link_metadata let anyone with the anon key put any email on
-- any guest link. With claim tokens in place, a reminder email carrying the
-- claim link would then go to whoever set it. The new version only accepts
-- the email from the browser session that created the link.
--
-- Part 1 of 2, additive: apply BEFORE deploying the app version that uses
-- the session-checked update_guest_link_metadata. Part 2
-- (20261101_guest_claim_part2.sql) drops the old one AFTER that deploy.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.create_guest_link(p_original_url text, p_short_code text, p_guest_session_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id uuid := gen_random_uuid();
    token text := gen_random_uuid()::text;
BEGIN
    INSERT INTO public.links (
        id, original_url, short_code, title, clicks, created_at,
        is_guest, guest_session_id, claim_token, metadata
    ) VALUES (
        new_id, p_original_url, p_short_code, 'Guest Link', 0, now(),
        true, p_guest_session_id, token,
        jsonb_build_object('guest_session_id', p_guest_session_id)
    );
    RETURN json_build_object('id', new_id, 'claim_token', token);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_guest_link(p_claim_token uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  UPDATE public.links
  SET user_id = p_user_id,
      is_guest = false,
      claim_token = NULL,
      expires_at = NULL,
      guest_session_id = NULL,
      metadata = coalesce(metadata, '{}'::jsonb) - 'guest_session_id' - 'guest_email'
  WHERE claim_token = p_claim_token::text
    AND is_guest
  RETURNING id INTO v_link_id;

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired claim token.';
  END IF;

  RETURN jsonb_build_object('success', true, 'link_id', v_link_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_guest_link_metadata(p_link_id uuid, p_email text, p_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR length(p_email) > 254 OR p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email' USING ERRCODE = '22023';
  END IF;
  UPDATE public.links
  SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('guest_email', p_email)
  WHERE id = p_link_id
    AND is_guest
    AND guest_session_id IS NOT NULL
    AND guest_session_id = p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_guest_link_metadata(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_guest_link_metadata(uuid, text, text) TO anon, authenticated, service_role;
