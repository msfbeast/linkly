-- 1. Let invitees accept team invites.
--
-- Accepting ran in the invitee's browser: it read the invite by token and
-- inserted a team_members row. RLS only lets team admins read invites or
-- add members, so every acceptance failed (9 invites sent, none accepted).
-- This SECURITY DEFINER function does it server-side with its own checks:
-- signed in, valid unexpired token, invite sent to the caller's email, and
-- a non-owner role. Adding the member and deleting the invite is atomic.

CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_invite public.team_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You need to be signed in to accept an invite' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_invite FROM public.team_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invite is invalid or has already been used' USING ERRCODE = 'P0002';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'This invite has expired' USING ERRCODE = 'P0001';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF lower(coalesce(v_email, '')) <> lower(v_invite.email) THEN
    RAISE EXCEPTION 'This invite was sent to a different email address' USING ERRCODE = '42501';
  END IF;

  IF v_invite.role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid invite role' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_invite.team_id, v_uid, v_invite.role)
  ON CONFLICT (team_id, user_id) DO NOTHING;

  DELETE FROM public.team_invites WHERE id = v_invite.id;

  RETURN v_invite.team_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_team_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_team_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;


-- 2. Enforce the Free plan's 15 personal links in the database.
--
-- The limit was only checked in the browser (LinkRepository.createLink),
-- so anyone inserting through the API directly could skip it. Same rule
-- and message as the client: free (or no) tier, personal links only
-- (team_id IS NULL). Applies to the API roles only: guest links (SECURITY
-- DEFINER RPCs), server routes (service role) and the SQL editor are not
-- affected. Existing links are untouched; it only stops new ones.

CREATE OR REPLACE FUNCTION public.enforce_free_link_limit()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_count integer;
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL OR NEW.team_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT subscription_tier INTO v_tier FROM public.profiles WHERE id = NEW.user_id;
  IF coalesce(v_tier, 'free') <> 'free' THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count FROM public.links
  WHERE user_id = NEW.user_id AND team_id IS NULL;

  IF v_count >= 15 THEN
    RAISE EXCEPTION 'Link limit reached for Free Tier. Please upgrade to create more links.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_link_limit ON public.links;
CREATE TRIGGER enforce_free_link_limit
  BEFORE INSERT ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_free_link_limit();
