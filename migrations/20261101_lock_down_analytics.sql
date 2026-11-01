-- Lock down analytics and other API-callable functions.
--
-- Anyone holding the public anon key (it ships in the app) could:
--   * read any user's analytics via get_user_*(p_user_id) and any link's
--     via get_link_stats, both SECURITY DEFINER with no ownership check;
--   * read, create and delete rows in analytics_share_tokens (no RLS), and so
--     read anyone's analytics through get_shared_analytics;
--   * read every link's stats through the click_stats_* views, which ran with
--     their owner's rights and bypassed click_events RLS;
--   * create teams owned by, or claim guest links for, any user id.
--
-- The function bodies below are the production ones (schema/baseline.sql)
-- with only a guard added after BEGIN. The app always passes the signed-in
-- user's own id, so no existing feature changes. Safe to re-run.

-- 1. Per-user analytics: only for the signed-in user themselves.
CREATE OR REPLACE FUNCTION public.get_user_click_stats(p_user_id uuid)
 RETURNS TABLE(total_clicks bigint, unique_visitors bigint, clicks_today bigint, clicks_this_week bigint, clicks_this_month bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_clicks,
        COUNT(DISTINCT ce.visitor_id)::BIGINT as unique_visitors,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '1 day')::BIGINT as clicks_today,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '7 days')::BIGINT as clicks_this_week,
        COUNT(*) FILTER (WHERE ce.timestamp > NOW() - INTERVAL '30 days')::BIGINT as clicks_this_month
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_user_country_breakdown(p_user_id uuid)
 RETURNS TABLE(country text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT COALESCE(ce.country, 'Unknown'), COUNT(*)::BIGINT
    FROM click_events ce INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id GROUP BY ce.country ORDER BY COUNT(*) DESC LIMIT 20;
END; $function$
;
CREATE OR REPLACE FUNCTION public.get_user_city_breakdown(p_user_id uuid)
 RETURNS TABLE(city text, country text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT COALESCE(ce.city, 'Unknown'), COALESCE(ce.country, 'Unknown'), COUNT(*)::BIGINT
    FROM click_events ce INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id AND ce.city IS NOT NULL GROUP BY ce.city, ce.country ORDER BY COUNT(*) DESC LIMIT 20;
END; $function$
;
CREATE OR REPLACE FUNCTION public.get_user_device_breakdown(p_user_id uuid)
 RETURNS TABLE(device text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT COALESCE(ce.device, 'Unknown'), COUNT(*)::BIGINT
    FROM click_events ce INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id GROUP BY ce.device ORDER BY COUNT(*) DESC;
END; $function$
;
CREATE OR REPLACE FUNCTION public.get_user_referrer_breakdown(p_user_id uuid)
 RETURNS TABLE(referrer text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT 
        COALESCE(CASE 
            WHEN ce.referrer IS NULL OR ce.referrer = '' THEN 'Direct'
            WHEN ce.referrer LIKE '%google%' THEN 'Google'
            WHEN ce.referrer LIKE '%facebook%' OR ce.referrer LIKE '%fb.%' THEN 'Facebook'
            WHEN ce.referrer LIKE '%twitter%' OR ce.referrer LIKE '%t.co%' THEN 'Twitter/X'
            WHEN ce.referrer LIKE '%instagram%' THEN 'Instagram'
            WHEN ce.referrer LIKE '%linkedin%' THEN 'LinkedIn'
            WHEN ce.referrer LIKE '%youtube%' THEN 'YouTube'
            WHEN ce.referrer LIKE '%whatsapp%' THEN 'WhatsApp'
            WHEN ce.referrer LIKE '%telegram%' OR ce.referrer LIKE '%t.me%' THEN 'Telegram'
            ELSE 'Other'
        END, 'Direct'), COUNT(*)::BIGINT
    FROM click_events ce INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id 
    GROUP BY CASE 
        WHEN ce.referrer IS NULL OR ce.referrer = '' THEN 'Direct'
        WHEN ce.referrer LIKE '%google%' THEN 'Google'
        WHEN ce.referrer LIKE '%facebook%' OR ce.referrer LIKE '%fb.%' THEN 'Facebook'
        WHEN ce.referrer LIKE '%twitter%' OR ce.referrer LIKE '%t.co%' THEN 'Twitter/X'
        WHEN ce.referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN ce.referrer LIKE '%linkedin%' THEN 'LinkedIn'
        WHEN ce.referrer LIKE '%youtube%' THEN 'YouTube'
        WHEN ce.referrer LIKE '%whatsapp%' THEN 'WhatsApp'
        WHEN ce.referrer LIKE '%telegram%' OR ce.referrer LIKE '%t.me%' THEN 'Telegram'
        ELSE 'Other' END
    ORDER BY COUNT(*) DESC;
END; $function$
;
CREATE OR REPLACE FUNCTION public.get_user_os_breakdown(p_user_id uuid)
 RETURNS TABLE(os text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT 
        COALESCE(ce.os, 'Unknown') as os,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY ce.os
    ORDER BY click_count DESC;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_user_browser_breakdown(p_user_id uuid)
 RETURNS TABLE(browser text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY SELECT COALESCE(ce.browser, 'Unknown'), COUNT(*)::BIGINT
    FROM click_events ce INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id GROUP BY ce.browser ORDER BY COUNT(*) DESC LIMIT 10;
END; $function$
;
CREATE OR REPLACE FUNCTION public.get_user_device_model_breakdown(p_user_id uuid)
 RETURNS TABLE(device_model text, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT 
        COALESCE(
            CASE 
                -- iPhone detection
                WHEN ce.raw_user_agent ILIKE '%iPhone%' THEN
                    CASE
                        WHEN ce.raw_user_agent ~ 'iPhone17,[1-4]' THEN 'iPhone 15 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone16,[1-2]' OR ce.raw_user_agent ~ 'iPhone15,[2-5]' THEN 'iPhone 14 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone14,[2-5]' THEN 'iPhone 13 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone13,[1-4]' THEN 'iPhone 12 Series'
                        WHEN ce.raw_user_agent ~ 'iPhone12,[1-8]' THEN 'iPhone 11 Series'
                        ELSE 'iPhone (Other)'
                    END
                -- iPad
                WHEN ce.raw_user_agent ILIKE '%iPad%' THEN 'iPad'
                -- Samsung S series
                WHEN ce.raw_user_agent ~ 'SM-S9[12][0-9]' THEN 'Galaxy S24 Series'
                WHEN ce.raw_user_agent ~ 'SM-S91[0-9]' THEN 'Galaxy S23 Series'
                WHEN ce.raw_user_agent ~ 'SM-S90[0-9]' THEN 'Galaxy S22 Series'
                -- Samsung A series
                WHEN ce.raw_user_agent ~ 'SM-A5[0-9]' THEN 'Galaxy A50/A55 Series'
                WHEN ce.raw_user_agent ~ 'SM-A3[0-9]' THEN 'Galaxy A30 Series'
                WHEN ce.raw_user_agent ~ 'SM-A1[0-9]' THEN 'Galaxy A10 Series'
                WHEN ce.raw_user_agent ILIKE '%SM-%' THEN 'Samsung (Other)'
                -- OnePlus
                WHEN ce.raw_user_agent ILIKE '%OnePlus%' THEN 'OnePlus'
                -- Xiaomi/Redmi
                WHEN ce.raw_user_agent ILIKE '%Redmi%' THEN 'Redmi'
                WHEN ce.raw_user_agent ILIKE '%Xiaomi%' THEN 'Xiaomi'
                -- Pixel
                WHEN ce.raw_user_agent ILIKE '%Pixel%' THEN 'Google Pixel'
                -- Desktop
                WHEN ce.raw_user_agent ILIKE '%Windows NT%' THEN 'Windows PC'
                WHEN ce.raw_user_agent ILIKE '%Macintosh%' THEN 'Mac'
                WHEN ce.raw_user_agent ILIKE '%Linux%' AND ce.raw_user_agent NOT ILIKE '%Android%' THEN 'Linux PC'
                -- Generic Android
                WHEN ce.raw_user_agent ILIKE '%Android%' THEN 'Android (Other)'
                ELSE 'Unknown'
            END,
            'Unknown'
        ) as device_model,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
    GROUP BY 
        CASE 
            WHEN ce.raw_user_agent ILIKE '%iPhone%' THEN
                CASE
                    WHEN ce.raw_user_agent ~ 'iPhone17,[1-4]' THEN 'iPhone 15 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone16,[1-2]' OR ce.raw_user_agent ~ 'iPhone15,[2-5]' THEN 'iPhone 14 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone14,[2-5]' THEN 'iPhone 13 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone13,[1-4]' THEN 'iPhone 12 Series'
                    WHEN ce.raw_user_agent ~ 'iPhone12,[1-8]' THEN 'iPhone 11 Series'
                    ELSE 'iPhone (Other)'
                END
            WHEN ce.raw_user_agent ILIKE '%iPad%' THEN 'iPad'
            WHEN ce.raw_user_agent ~ 'SM-S9[12][0-9]' THEN 'Galaxy S24 Series'
            WHEN ce.raw_user_agent ~ 'SM-S91[0-9]' THEN 'Galaxy S23 Series'
            WHEN ce.raw_user_agent ~ 'SM-S90[0-9]' THEN 'Galaxy S22 Series'
            WHEN ce.raw_user_agent ~ 'SM-A5[0-9]' THEN 'Galaxy A50/A55 Series'
            WHEN ce.raw_user_agent ~ 'SM-A3[0-9]' THEN 'Galaxy A30 Series'
            WHEN ce.raw_user_agent ~ 'SM-A1[0-9]' THEN 'Galaxy A10 Series'
            WHEN ce.raw_user_agent ILIKE '%SM-%' THEN 'Samsung (Other)'
            WHEN ce.raw_user_agent ILIKE '%OnePlus%' THEN 'OnePlus'
            WHEN ce.raw_user_agent ILIKE '%Redmi%' THEN 'Redmi'
            WHEN ce.raw_user_agent ILIKE '%Xiaomi%' THEN 'Xiaomi'
            WHEN ce.raw_user_agent ILIKE '%Pixel%' THEN 'Google Pixel'
            WHEN ce.raw_user_agent ILIKE '%Windows NT%' THEN 'Windows PC'
            WHEN ce.raw_user_agent ILIKE '%Macintosh%' THEN 'Mac'
            WHEN ce.raw_user_agent ILIKE '%Linux%' AND ce.raw_user_agent NOT ILIKE '%Android%' THEN 'Linux PC'
            WHEN ce.raw_user_agent ILIKE '%Android%' THEN 'Android (Other)'
            ELSE 'Unknown'
        END
    ORDER BY click_count DESC
    LIMIT 15;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_user_clicks_over_time(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(click_date date, click_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT 
        DATE(ce.timestamp) as click_date,
        COUNT(*)::BIGINT as click_count
    FROM click_events ce
    INNER JOIN links l ON ce.link_id = l.id
    WHERE l.user_id = p_user_id
      AND ce.timestamp > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(ce.timestamp)
    ORDER BY click_date;
END;
$function$
;
-- 2. Per-link stats: only for the link owner or a member of its team.
CREATE OR REPLACE FUNCTION public.get_link_stats(p_link_id uuid)
 RETURNS TABLE(total_clicks bigint, unique_visitors bigint, top_country text, top_city text, top_referrer text, clicks_by_day json)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' AND NOT EXISTS (
        SELECT 1 FROM public.links l
        WHERE l.id = p_link_id
          AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(l.team_id)))
    ) THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    WITH daily_clicks AS (
        SELECT 
            DATE(timestamp) as day,
            COUNT(*) as count
        FROM click_events
        WHERE link_id = p_link_id
          AND timestamp > NOW() - INTERVAL '30 days'
        GROUP BY DATE(timestamp)
        ORDER BY day
    )
    SELECT 
        (SELECT COUNT(*) FROM click_events WHERE link_id = p_link_id)::BIGINT,
        (SELECT COUNT(DISTINCT visitor_id) FROM click_events WHERE link_id = p_link_id)::BIGINT,
        (SELECT country FROM click_events WHERE link_id = p_link_id GROUP BY country ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT city FROM click_events WHERE link_id = p_link_id AND city IS NOT NULL GROUP BY city ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT referrer FROM click_events WHERE link_id = p_link_id AND referrer IS NOT NULL GROUP BY referrer ORDER BY COUNT(*) DESC LIMIT 1),
        (SELECT json_agg(json_build_object('day', day, 'count', count)) FROM daily_clicks);
END;
$function$
;
-- 3. Teams and guest links can only be created/claimed for yourself.
CREATE OR REPLACE FUNCTION public.create_team_with_owner(p_name text, p_slug text, p_owner_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_team_id UUID;
  v_count INTEGER;
BEGIN
    IF p_owner_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
  -- A. Input Validation
  IF length(p_name) < 3 OR length(p_name) > 50 THEN
    RAISE EXCEPTION 'Invalid name: Must be between 3 and 50 characters.';
  END IF;
  IF NOT p_slug ~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid slug: Must contain only lowercase letters, numbers, and hyphens.';
  END IF;

  -- B. Rate Limiting (5 per hour)
  SELECT count(*) INTO v_count FROM teams 
  WHERE owner_id = p_owner_id AND created_at > NOW() - INTERVAL '1 hour';
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: You can only create 5 teams per hour.';
  END IF;

  -- C. Execution
  INSERT INTO teams (name, slug, owner_id) VALUES (p_name, p_slug, p_owner_id) RETURNING id INTO v_team_id;
  INSERT INTO team_members (team_id, user_id, role) VALUES (v_team_id, p_owner_id, 'owner');
  RETURN jsonb_build_object('id', v_team_id, 'name', p_name, 'slug', p_slug);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.claim_guest_link(p_claim_token uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_link_id UUID;
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
  -- Update the link to belong to the user
  UPDATE public.links
  SET 
    user_id = p_user_id,
    is_guest = false,
    claim_token = NULL,
    expires_at = NULL,
    guest_session_id = NULL
  WHERE claim_token = p_claim_token
  AND is_guest = true
  RETURNING id INTO v_link_id;

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired claim token.';
  END IF;

  RETURN jsonb_build_object('success', true, 'link_id', v_link_id);
END;
$function$
;
-- 4. Share tokens: created only by signed-in users, for themselves.
CREATE OR REPLACE FUNCTION public.create_analytics_share_token(p_expires_in_days integer DEFAULT NULL::integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in to share analytics' USING ERRCODE = '42501';
    END IF;
    -- Generate random token
    v_token := encode(gen_random_bytes(16), 'hex');
    
    -- Calculate expiry if specified
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Insert token
    INSERT INTO analytics_share_tokens (user_id, token, expires_at)
    VALUES (auth.uid(), v_token, v_expires_at);
    
    RETURN v_token;
END;
$function$
;
-- 5. analytics_share_tokens: owners see and revoke their own; everything
--    else goes through create_analytics_share_token / get_shared_analytics.
ALTER TABLE public.analytics_share_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.analytics_share_tokens FROM anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.analytics_share_tokens TO authenticated;
DROP POLICY IF EXISTS "Owners can view their share tokens" ON public.analytics_share_tokens;
CREATE POLICY "Owners can view their share tokens" ON public.analytics_share_tokens
    FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Owners can revoke their share tokens" ON public.analytics_share_tokens;
CREATE POLICY "Owners can revoke their share tokens" ON public.analytics_share_tokens
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. click_stats_* views: run as the caller, so click_events RLS (own links
--    only) applies. Not used by the app; read-only, signed-in only.
DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['click_stats_by_country', 'click_stats_by_city', 'click_stats_by_device',
                           'click_stats_by_referrer', 'click_stats_daily'] LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', v);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', v);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', v);
  END LOOP;
END $$;

-- 7. Who may call what.
--    Signed-in users only:
REVOKE ALL ON FUNCTION public.get_user_click_stats(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_country_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_city_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_device_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_referrer_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_os_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_browser_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_device_model_breakdown(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_clicks_over_time(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_link_stats(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_team_with_owner(text, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_guest_link(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_analytics_share_token(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_team_invite(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_click_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_country_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_city_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_device_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_referrer_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_os_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_browser_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_device_model_breakdown(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_clicks_over_time(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_link_stats(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_team_with_owner(text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_guest_link(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_analytics_share_token(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_team_invite(uuid, text, text, text) TO authenticated, service_role;

--    Not part of the API: unused legacy functions (they take any user id),
--    record_click (writes columns that no longer exist), and the signup
--    trigger function.
REVOKE ALL ON FUNCTION public.get_click_trends(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_device_breakdown(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_top_cities(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_traffic_sources(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_click(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_click_trends(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_device_breakdown(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_top_cities(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_traffic_sources(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_click(uuid, jsonb) TO service_role;

-- 8. Pin search_path on every public function that didn't set one, so a
--    caller's search_path can't redirect what they resolve to.
DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
      AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', f);
  END LOOP;
END $$;
