-- Admin dashboard numbers and user list, from the server.
--
-- The dashboard used to count rows from the browser. profiles has no
-- created_at, so "new users this month" always failed and showed 0; join
-- dates live in auth.users, which the browser can't read. Revenue was a
-- guess in dollars that counted comp accounts. This returns real counts
-- and, for each user, email, join date, last sign-in, plan, role, links
-- and clicks. Admins only (is_platform_admin, 20261117_link_reports.sql).

CREATE OR REPLACE FUNCTION public.admin_overview(p_search text DEFAULT NULL, p_limit integer DEFAULT 100)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    q text := nullif(lower(trim(coalesce(p_search, ''))), '');
    lim integer := least(greatest(coalesce(p_limit, 100), 1), 500);
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;

    RETURN json_build_object(
        'stats', json_build_object(
            'users', (SELECT count(*) FROM auth.users),
            'usersLast30d', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days'),
            'activeLast30d', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '30 days'),
            'links', (SELECT count(*) FROM public.links WHERE NOT coalesce(is_guest, false)),
            'linksLast30d', (SELECT count(*) FROM public.links WHERE NOT coalesce(is_guest, false) AND created_at > now() - interval '30 days'),
            'guestLinks', (SELECT count(*) FROM public.links WHERE coalesce(is_guest, false)),
            'clicksLast7d', (SELECT coalesce(sum(clicks), 0) FROM public.click_rollups
                             WHERE dim = 'total' AND bucket >= date_trunc('hour', now() - interval '7 days')),
            'plans', (SELECT coalesce(json_object_agg(tier, n), '{}'::json)
                      FROM (SELECT coalesce(subscription_tier, 'free') AS tier, count(*) AS n
                            FROM public.profiles GROUP BY 1) t)
        ),
        'users', (
            SELECT coalesce(json_agg(u ORDER BY u.joined DESC), '[]'::json)
            FROM (
                SELECT au.id,
                       au.email,
                       coalesce(p.full_name, '') AS name,
                       coalesce(p.username, '') AS username,
                       coalesce(p.subscription_tier, 'free') AS plan,
                       coalesce(p.role::text, 'user') AS role,
                       au.created_at AS joined,
                       au.last_sign_in_at AS "lastSignIn",
                       (SELECT count(*) FROM public.links l WHERE l.user_id = au.id) AS links,
                       (SELECT coalesce(sum(l.clicks), 0) FROM public.links l WHERE l.user_id = au.id) AS clicks
                FROM auth.users au
                LEFT JOIN public.profiles p ON p.id = au.id
                WHERE q IS NULL
                   OR lower(au.email) LIKE '%' || q || '%'
                   OR lower(coalesce(p.full_name, '')) LIKE '%' || q || '%'
                   OR lower(coalesce(p.username, '')) LIKE '%' || q || '%'
                ORDER BY au.created_at DESC
                LIMIT lim
            ) u
        )
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_overview(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview(text, integer) TO authenticated, service_role;
