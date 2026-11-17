-- Error monitoring without a third-party service.
--
-- Browser errors (uncaught exceptions, unhandled promise rejections, React
-- render errors) and server errors from the API functions are sent to
-- /api/client-error (rate-limited per visitor) and grouped here by
-- fingerprint: one row per distinct error with a count and first/last
-- seen. Admins read them in the admin dashboard. Rows not seen for 30 days
-- are deleted by the daily cleanup job.
--
-- No IP addresses or query strings are stored; messages are truncated.
-- Needs is_platform_admin() from 20261117_link_reports.sql. Additive. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.error_log (
    fingerprint text PRIMARY KEY,
    source text NOT NULL CHECK (source IN ('browser', 'server')),
    message text NOT NULL,
    stack text,
    path text,
    release text,
    user_agent text,
    count integer NOT NULL DEFAULT 1,
    first_seen timestamptz NOT NULL DEFAULT now(),
    last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS error_log_last_seen ON public.error_log (last_seen DESC);

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.error_log FROM PUBLIC, anon, authenticated;

-- One call per occurrence, from /api/client-error (service role).
CREATE OR REPLACE FUNCTION public.record_error(
    p_fingerprint text, p_source text, p_message text, p_stack text,
    p_path text, p_release text, p_user_agent text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.error_log AS e (fingerprint, source, message, stack, path, release, user_agent)
    VALUES (left(p_fingerprint, 64), p_source, left(p_message, 1000), left(p_stack, 4000),
            left(p_path, 300), left(p_release, 64), left(p_user_agent, 300))
    ON CONFLICT (fingerprint) DO UPDATE
    SET count = e.count + 1,
        last_seen = now(),
        path = EXCLUDED.path,
        release = EXCLUDED.release,
        user_agent = EXCLUDED.user_agent;
$$;
REVOKE ALL ON FUNCTION public.record_error(text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_error(text, text, text, text, text, text, text) TO service_role;

-- Admin dashboard: errors seen in the last p_days, most frequent first.
CREATE OR REPLACE FUNCTION public.admin_recent_errors(p_days integer DEFAULT 7)
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
    RETURN (
        SELECT coalesce(json_agg(json_build_object(
                   'fingerprint', fingerprint, 'source', source, 'message', message, 'stack', stack,
                   'path', path, 'release', release, 'userAgent', user_agent, 'count', count,
                   'firstSeen', first_seen, 'lastSeen', last_seen) ORDER BY last_seen DESC), '[]'::json)
        FROM (SELECT * FROM public.error_log
              WHERE last_seen > now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 90))
              ORDER BY last_seen DESC LIMIT 200) e
    );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_recent_errors(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_recent_errors(integer) TO authenticated, service_role;
