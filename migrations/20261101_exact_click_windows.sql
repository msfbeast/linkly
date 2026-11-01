-- Exact "today / this week / this month" counts from the hourly rollups.
--
-- get_user_click_stats summed hourly 'total' buckets with
-- bucket > now() - <window> - 1 hour, so the bucket holding the window's
-- start was counted whole: up to an hour of clicks older than the window
-- (about 2% extra on "today", on average). The raw-click version counted
-- timestamp > now() - <window> exactly.
--
-- Now each window is the hourly buckets that lie entirely inside it, plus
-- the raw clicks in the one partial hour at its start (a one-hour range on
-- the click_events timestamp index). Same name, guard and output columns.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_user_click_stats(p_user_id uuid)
RETURNS TABLE(total_clicks bigint, unique_visitors bigint, clicks_today bigint, clicks_this_week bigint, clicks_this_month bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    t_now timestamptz := now();
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    WITH w(name, starts) AS (
        VALUES ('day', t_now - interval '1 day'),
               ('week', t_now - interval '7 days'),
               ('month', t_now - interval '30 days')
    ),
    -- First full hour inside each window; the hour before it is partial.
    edges AS (
        SELECT name, starts, date_trunc('hour', starts) + interval '1 hour' AS full_from FROM w
    ),
    rolled AS (
        SELECT
            coalesce(sum(r.clicks), 0)::bigint AS total,
            coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= (SELECT full_from FROM edges WHERE name = 'day')), 0)::bigint AS day,
            coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= (SELECT full_from FROM edges WHERE name = 'week')), 0)::bigint AS week,
            coalesce(sum(r.clicks) FILTER (WHERE r.bucket >= (SELECT full_from FROM edges WHERE name = 'month')), 0)::bigint AS month
        FROM public.click_rollups r
        JOIN public.links l ON l.id = r.link_id
        WHERE l.user_id = p_user_id AND r.dim = 'total'
    ),
    partial AS (
        SELECT e.name, count(ce.*)::bigint AS n
        FROM edges e
        LEFT JOIN public.click_events ce
          ON ce.timestamp > e.starts AND ce.timestamp < e.full_from
         AND ce.link_id IN (SELECT id FROM public.links WHERE user_id = p_user_id)
        GROUP BY e.name
    )
    SELECT
        rolled.total,
        (SELECT count(DISTINCT v.visitor_id) FROM public.click_visitors v
           JOIN public.links lv ON lv.id = v.link_id WHERE lv.user_id = p_user_id)::bigint,
        rolled.day + (SELECT n FROM partial WHERE name = 'day'),
        rolled.week + (SELECT n FROM partial WHERE name = 'week'),
        rolled.month + (SELECT n FROM partial WHERE name = 'month')
    FROM rolled;
END;
$$;
