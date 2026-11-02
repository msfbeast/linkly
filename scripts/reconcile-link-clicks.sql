-- One-off: set links.clicks to the number of recorded clicks.
--
-- links.clicks drifted 46,337 above count(click_events) across 332 links
-- (checked 2026-11-02, never below except one link). The cause was an old
-- fallback in pages/Redirect.tsx (removed 2026-11-01, 35b7727) that bumped the
-- counter after a click insert that always failed (it wrote columns
-- click_events doesn't have).
--
-- Run in the SQL editor. Reports what it changed. A click recorded while
-- this runs can leave its link one off; running it again fixes that.

WITH counted AS (
    SELECT l.id, l.clicks AS before, coalesce(e.n, 0) AS after
    FROM public.links l
    LEFT JOIN (SELECT link_id, count(*) AS n FROM public.click_events GROUP BY 1) e ON e.link_id = l.id
    WHERE l.clicks IS DISTINCT FROM coalesce(e.n, 0)
),
updated AS (
    UPDATE public.links l SET clicks = c.after
    FROM counted c WHERE l.id = c.id
    RETURNING c.before, c.after
)
SELECT count(*) AS links_corrected,
       coalesce(sum(before - after), 0) AS clicks_removed,
       coalesce(max(abs(before - after)), 0) AS largest_correction
FROM updated;
