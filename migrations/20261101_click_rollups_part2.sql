-- Part 2 of 20261101_click_rollups.sql: the dashboard analytics functions
-- read the running totals instead of every raw click. Same names,
-- arguments, guards, output columns, ordering and limits as before.
--
-- Apply AFTER the backfill has covered every month up to the cutoff
-- (until then older months would be missing). Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_user_click_stats(p_user_id uuid)
RETURNS TABLE(total_clicks bigint, unique_visitors bigint, clicks_today bigint, clicks_this_week bigint, clicks_this_month bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT
        coalesce(sum(r.clicks), 0)::bigint,
        (SELECT count(DISTINCT v.visitor_id) FROM public.click_visitors v
           JOIN public.links lv ON lv.id = v.link_id WHERE lv.user_id = p_user_id)::bigint,
        coalesce(sum(r.clicks) FILTER (WHERE r.bucket > now() - interval '1 day' - interval '1 hour'), 0)::bigint,
        coalesce(sum(r.clicks) FILTER (WHERE r.bucket > now() - interval '7 days' - interval '1 hour'), 0)::bigint,
        coalesce(sum(r.clicks) FILTER (WHERE r.bucket > now() - interval '30 days' - interval '1 hour'), 0)::bigint
    FROM public.click_rollups r
    JOIN public.links l ON l.id = r.link_id
    WHERE l.user_id = p_user_id AND r.dim = 'total';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_clicks_over_time(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS TABLE(click_date date, click_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT date(r.bucket) AS click_date, sum(r.clicks)::bigint AS click_count
    FROM public.click_rollups r
    JOIN public.links l ON l.id = r.link_id
    WHERE l.user_id = p_user_id AND r.dim = 'total'
      AND r.bucket >= date_trunc('hour', now() - (p_days || ' days')::interval)
    GROUP BY date(r.bucket)
    ORDER BY click_date;
END;
$$;

-- One breakdown over the monthly rollups: (value, clicks), most first.
CREATE OR REPLACE FUNCTION public.user_rollup_breakdown(p_user_id uuid, p_dim text, p_limit integer)
RETURNS TABLE(val text, val2 text, click_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.val, r.val2, sum(r.clicks)::bigint
  FROM public.click_rollups r
  JOIN public.links l ON l.id = r.link_id
  WHERE l.user_id = p_user_id AND r.dim = p_dim
  GROUP BY r.val, r.val2
  ORDER BY 3 DESC
  LIMIT p_limit;
$$;
REVOKE ALL ON FUNCTION public.user_rollup_breakdown(uuid, text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_country_breakdown(p_user_id uuid)
RETURNS TABLE(country text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'country', 20) b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_city_breakdown(p_user_id uuid)
RETURNS TABLE(city text, country text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.val2, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'city', 20) b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_device_breakdown(p_user_id uuid)
RETURNS TABLE(device text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'device', NULL) b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_os_breakdown(p_user_id uuid)
RETURNS TABLE(os text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'os', NULL) b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_browser_breakdown(p_user_id uuid)
RETURNS TABLE(browser text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'browser', 10) b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_referrer_breakdown(p_user_id uuid)
RETURNS TABLE(referrer text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'referrer', NULL) b;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_device_model_breakdown(p_user_id uuid)
RETURNS TABLE(device_model text, click_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT b.val, b.click_count FROM public.user_rollup_breakdown(p_user_id, 'model', 15) b;
END;
$$;
