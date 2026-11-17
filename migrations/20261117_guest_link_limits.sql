-- Limits on making links.
--
-- Guest links (no account, from the landing page) were free, unlimited and
-- permanent, and any browser could create them by calling
-- create_guest_link with the public key: the easiest way to mass-produce
-- short links for spam or phishing on links.trak.in. Now:
--   * they are created through /api/link/guest, which checks the address,
--     makes the code and allows 10 per visitor per hour;
--   * they stop working 7 days after creation unless claimed by signing up
--     (claim_guest_link already clears expires_at). The redirect treats an
--     expired guest link as gone and the daily cleanup job deletes it.
--     The 188 existing guest links, none of them ever clicked, get 7 days
--     from now.
-- Signed-in accounts can create at most 200 links an hour (any plan), so a
-- stolen or scripted account can't flood the table either.
--
-- Part 1 of 2, additive: apply BEFORE deploying the app version that uses
-- /api/link/guest. Part 2 (20261117_guest_link_limits_part2.sql) stops
-- browsers calling create_guest_link directly and goes AFTER that deploy.
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
        is_guest, guest_session_id, claim_token, expires_at, metadata
    ) VALUES (
        new_id, p_original_url, p_short_code, 'Guest Link', 0, now(),
        true, p_guest_session_id, token, now() + interval '7 days',
        jsonb_build_object('guest_session_id', p_guest_session_id)
    );
    RETURN json_build_object('id', new_id, 'claim_token', token);
END;
$$;

UPDATE public.links
SET expires_at = now() + interval '7 days'
WHERE is_guest AND expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_links_user_created ON public.links (user_id, created_at);

CREATE OR REPLACE FUNCTION public.limit_link_creation_rate()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: current_user must be the caller's role.
SET search_path = public
AS $$
BEGIN
    IF current_user NOT IN ('anon', 'authenticated') OR NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF (SELECT count(*) FROM public.links
        WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour') >= 200 THEN
        RAISE EXCEPTION 'You have made 200 links in the last hour. Please wait a while before making more.'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.limit_link_creation_rate() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS limit_link_creation_rate ON public.links;
CREATE TRIGGER limit_link_creation_rate
    BEFORE INSERT ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.limit_link_creation_rate();
