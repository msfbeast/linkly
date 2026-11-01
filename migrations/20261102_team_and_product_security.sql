-- Close two holes found in the 2026-11-02 security audit.
--
-- 1. Serving links on someone else's custom domain.
--    A custom domain serves a link when the link's owner owns the domain or
--    the domain owner belongs to the link's team (api/_lib/customDomainAccess.ts).
--    Anyone could read who owns a domain, make a team, add that person to it
--    with no consent ("Team admins can add members"), create a team link
--    such as 'login', and have victim.com/login redirect to their page.
--    Owners could also move their own link into any team, member or not, so
--    putting it in the victim's own team worked without adding anyone.
--    Related: admins could promote themselves to owner or take the team
--    (team_members / teams UPDATE had no checks), and an editor could make
--    a team link their own (user_id = self) and then delete it.
--
--    Now:
--    - Nobody adds other people to a team directly. Members join through
--      accept_team_invite (invites name the email; the invitee accepts) or
--      create_team_with_owner. The owner adding themselves stays allowed
--      (TeamRepository.createTeamFallback).
--    - Admins can change and remove members but not the owner, and can't
--      make anyone owner.
--    - Only the current owner can change teams.owner_id.
--    - A link can be created in, or moved into, a team only by an
--      owner/admin/editor of that team.
--    - A link's user_id and team_id can be changed only by its owner (or by
--      server-side code: SECURITY DEFINER functions such as
--      claim_guest_link, and the service role).
--
-- 2. Reading a password-protected link's destination.
--    fill_product_url_from_link (SECURITY DEFINER) copied any link's
--    original_url into a new product, and products are publicly readable.
--    get_public_link returns a gated link's id, so anyone could recover the
--    hidden URL, skipping the password, expiry and unlock attempt limit.
--    Now a product can only point at a link its owner owns or edits as a
--    team member, and only then is the URL copied.
--
-- No existing rows break: in production no team has a non-owner member and
-- no product points at another user's link (checked 2026-11-02).
-- Safe to re-run.

-- Owner, admin or editor of the team (for writes to team links).
CREATE OR REPLACE FUNCTION public.can_edit_team(team_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  );
$$;
-- anon too: the links policies below apply TO public, and the function just
-- returns false without a signed-in user.
REVOKE ALL ON FUNCTION public.can_edit_team(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_edit_team(uuid) TO anon, authenticated, service_role;

-- Owner or admin of the team (for managing members).
CREATE OR REPLACE FUNCTION public.can_manage_team(team_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;
REVOKE ALL ON FUNCTION public.can_manage_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_team(uuid) TO authenticated, service_role;

-- ---- team_members -------------------------------------------------------

-- No direct adds of other people: join via accept_team_invite or
-- create_team_with_owner. "Team owners can add themselves" stays.
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;

DROP POLICY IF EXISTS "Team admins can update members" ON public.team_members;
CREATE POLICY "Team admins can update members" ON public.team_members
    FOR UPDATE TO authenticated
    USING (public.can_manage_team(team_id) AND role <> 'owner')
    WITH CHECK (public.can_manage_team(team_id) AND role IN ('admin', 'editor', 'viewer'));

DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;
CREATE POLICY "Team admins can remove members" ON public.team_members
    FOR DELETE TO authenticated
    USING (public.can_manage_team(team_id) AND role <> 'owner');

-- ---- teams --------------------------------------------------------------

DROP POLICY IF EXISTS "Owners and Admins can update teams" ON public.teams;
CREATE POLICY "Owners and Admins can update teams" ON public.teams
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id OR public.can_manage_team(id))
    WITH CHECK (auth.uid() = owner_id OR public.can_manage_team(id));

-- Only the current owner hands the team over (policies can't compare old
-- and new rows, so a trigger does it).
CREATE OR REPLACE FUNCTION public.guard_team_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
     AND current_user IN ('authenticated', 'anon')
     AND auth.uid() IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Only the team owner can transfer the team' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_team_owner_change ON public.teams;
CREATE TRIGGER guard_team_owner_change BEFORE UPDATE OF owner_id ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.guard_team_owner_change();

-- ---- links --------------------------------------------------------------

-- A link goes into a team only if the caller can edit that team.
DROP POLICY IF EXISTS "Users can insert own links" ON public.links;
CREATE POLICY "Users can insert own links" ON public.links
    FOR INSERT TO public
    WITH CHECK (auth.uid() = user_id AND (team_id IS NULL OR public.can_edit_team(team_id)));

DROP POLICY IF EXISTS "Users can update own links" ON public.links;
CREATE POLICY "Users can update own links" ON public.links
    FOR UPDATE TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND (team_id IS NULL OR public.can_edit_team(team_id)));

-- Only a link's owner changes who owns it or which team it's in.
CREATE OR REPLACE FUNCTION public.guard_link_ownership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon')
     AND OLD.user_id IS NOT NULL
     AND auth.uid() IS DISTINCT FROM OLD.user_id
     AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.team_id IS DISTINCT FROM OLD.team_id) THEN
    RAISE EXCEPTION 'Only the link owner can change its owner or team' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_link_ownership ON public.links;
CREATE TRIGGER guard_link_ownership BEFORE UPDATE OF user_id, team_id ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.guard_link_ownership();

-- ---- products -----------------------------------------------------------

-- Copy a link's URL into a product only for the link's owner or an editor
-- of its team; refuse links the product's owner can't edit.
CREATE OR REPLACE FUNCTION public.fill_product_url_from_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
BEGIN
  IF NEW.link_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, user_id, team_id, original_url INTO l FROM public.links WHERE id = NEW.link_id;
  IF l.id IS NULL THEN
    RETURN NEW;  -- the foreign key reports a missing link
  END IF;

  IF l.user_id IS DISTINCT FROM NEW.user_id AND NOT (
       l.team_id IS NOT NULL AND EXISTS (
         SELECT 1 FROM public.team_members tm
         WHERE tm.team_id = l.team_id AND tm.user_id = NEW.user_id
           AND tm.role IN ('owner', 'admin', 'editor'))) THEN
    RAISE EXCEPTION 'A product can only use your own links' USING ERRCODE = '42501';
  END IF;

  IF coalesce(NEW.original_url, '') = '' THEN
    NEW.original_url := l.original_url;
  END IF;
  RETURN NEW;
END;
$$;
