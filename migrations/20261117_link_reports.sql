-- Reporting links, and taking them down.
--
-- Anyone can report a short link (spam, phishing, malware, ...) from the
-- /report page; reports reach link_reports only through /api/link/report,
-- which rate-limits per visitor. Platform admins (profiles.role admin or
-- super_admin) see open reports in the admin dashboard and can disable a
-- link, re-enable it, or dismiss its reports.
--
-- A disabled link (links.disabled_at set):
--   * no longer redirects; visitors get a "this link has been disabled"
--     page (the redirect and /go/ pages read the new columns);
--   * has its destination hidden from the public lookups, like a locked
--     link (link_public_json);
--   * stays visible to its owner, marked disabled. Only admins can change
--     disabled_at / disabled_reason.
--
-- Additive. Safe to re-run.

ALTER TABLE public.links ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS disabled_reason text;

CREATE TABLE IF NOT EXISTS public.link_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (reason IN ('phishing', 'malware', 'spam', 'scam', 'adult', 'other')),
    details text CHECK (length(details) <= 1000),
    reporter text,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'actioned')),
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS link_reports_open ON public.link_reports (link_id) WHERE status = 'open';

-- Written by /api/link/report (service role), read through the admin
-- functions below. No API access.
ALTER TABLE public.link_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.link_reports FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') = 'service_role'
      OR EXISTS (SELECT 1 FROM public.profiles
                 WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin'));
$$;
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;

-- Owners (and anyone else through the API) can't set or clear the takedown.
CREATE OR REPLACE FUNCTION public.guard_link_disabled()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF current_user NOT IN ('anon', 'authenticated') OR public.is_platform_admin() THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'INSERT' THEN
        NEW.disabled_at := NULL;
        NEW.disabled_reason := NULL;
    ELSIF NEW.disabled_at IS DISTINCT FROM OLD.disabled_at
       OR NEW.disabled_reason IS DISTINCT FROM OLD.disabled_reason THEN
        RAISE EXCEPTION 'Only Gather staff can enable or disable a reported link.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_link_disabled() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER guard_link_disabled
    BEFORE INSERT OR UPDATE OF disabled_at, disabled_reason ON public.links
    FOR EACH ROW EXECUTE FUNCTION public.guard_link_disabled();

-- Public projection: a disabled link shows no destination.
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
      (to_jsonb(l) - 'password_hash' - 'claim_token' - 'guest_session_id' - 'ai_analysis' - 'disabled_reason')
        || jsonb_build_object(
             'metadata', coalesce(l.metadata, '{}'::jsonb) - 'guest_email' - 'guest_session_id',
             'requires_password', coalesce(l.password_hash, '') <> '') AS base,
      (coalesce(l.password_hash, '') <> ''
        OR l.disabled_at IS NOT NULL
        OR (l.expiration_date IS NOT NULL AND l.expiration_date < now())
        OR (l.start_date IS NOT NULL AND l.start_date > (extract(epoch FROM now()) * 1000)::bigint)
        OR (l.max_clicks IS NOT NULL AND coalesce(l.clicks, 0) >= l.max_clicks)) AS gated
  ) s;
$$;

-- Admin: open reports grouped by link, and disabled links.
CREATE OR REPLACE FUNCTION public.admin_link_reports()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN json_build_object(
        'open', (
            SELECT coalesce(json_agg(x ORDER BY x.latest DESC), '[]'::json) FROM (
                SELECT l.id AS "linkId", l.short_code AS "shortCode", l.title, l.original_url AS "originalUrl",
                       l.clicks, l.is_guest AS "isGuest", l.created_at AS "linkCreatedAt",
                       u.email AS "ownerEmail", l.disabled_at AS "disabledAt",
                       count(r.*) AS reports, count(DISTINCT r.reporter) AS reporters,
                       max(r.created_at) AS latest,
                       json_agg(json_build_object('reason', r.reason, 'details', r.details, 'at', r.created_at)
                                ORDER BY r.created_at DESC) AS items
                FROM public.link_reports r
                JOIN public.links l ON l.id = r.link_id
                LEFT JOIN auth.users u ON u.id = l.user_id
                WHERE r.status = 'open'
                GROUP BY l.id, u.email
            ) x
        ),
        'disabled', (
            SELECT coalesce(json_agg(json_build_object(
                       'linkId', l.id, 'shortCode', l.short_code, 'title', l.title,
                       'originalUrl', l.original_url, 'disabledAt', l.disabled_at,
                       'reason', l.disabled_reason) ORDER BY l.disabled_at DESC), '[]'::json)
            FROM (SELECT * FROM public.links WHERE disabled_at IS NOT NULL ORDER BY disabled_at DESC LIMIT 200) l
        )
    );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_link_reports() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_link_reports() TO authenticated, service_role;

-- Admin: disable / enable a link, or dismiss its open reports.
-- Returns the short code so the caller can clear the redirect cache.
CREATE OR REPLACE FUNCTION public.admin_moderate_link(p_link_id uuid, p_action text, p_reason text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code text;
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    IF p_action = 'disable' THEN
        UPDATE public.links
        SET disabled_at = coalesce(disabled_at, now()),
            disabled_reason = left(coalesce(nullif(btrim(p_reason), ''), 'Reported for abuse'), 200)
        WHERE id = p_link_id RETURNING short_code INTO code;
        UPDATE public.link_reports SET status = 'actioned', resolved_at = now(), resolved_by = auth.uid()
        WHERE link_id = p_link_id AND status = 'open';
    ELSIF p_action = 'enable' THEN
        UPDATE public.links SET disabled_at = NULL, disabled_reason = NULL
        WHERE id = p_link_id RETURNING short_code INTO code;
    ELSIF p_action = 'dismiss' THEN
        UPDATE public.link_reports SET status = 'dismissed', resolved_at = now(), resolved_by = auth.uid()
        WHERE link_id = p_link_id AND status = 'open';
        SELECT short_code INTO code FROM public.links WHERE id = p_link_id;
    ELSE
        RAISE EXCEPTION 'Unknown action' USING ERRCODE = '22023';
    END IF;
    IF code IS NULL THEN
        RAISE EXCEPTION 'Link not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN code;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_moderate_link(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_link(uuid, text, text) TO authenticated, service_role;
