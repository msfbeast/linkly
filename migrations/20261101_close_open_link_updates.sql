-- HOTFIX: anyone could edit any link.
--
-- The policy "Anyone can update link clicks" (FOR UPDATE USING (true)
-- WITH CHECK (true)) let anyone holding the public anon key change any
-- column of any link, e.g. repoint every short link to a phishing page.
-- It existed for browser-side click counting, which is now server-only.
--
-- Owners keep "Users can update own links". Team links were editable by
-- teammates only through the open policy, so that gets a proper policy:
-- owners, admins and editors of the link's team. Safe to re-run.

DROP POLICY IF EXISTS "Anyone can update link clicks" ON public.links;

DROP POLICY IF EXISTS "Team editors can update team links" ON public.links;
CREATE POLICY "Team editors can update team links" ON public.links
    FOR UPDATE TO authenticated
    USING (
        team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = links.team_id AND tm.user_id = auth.uid()
              AND tm.role IN ('owner', 'admin', 'editor')
        )
    )
    WITH CHECK (
        team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = links.team_id AND tm.user_id = auth.uid()
              AND tm.role IN ('owner', 'admin', 'editor')
        )
    );
