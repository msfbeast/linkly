import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Whether a short link may resolve on a custom domain.
 *
 * Allowed when the link belongs to the domain's owner, or when it is a team
 * link (links.team_id) for a team the domain owner belongs to, as a member
 * or as the team's owner. A teammate's personal links (no team_id) stay
 * off the owner's domain, and any other user's links never resolve there.
 */
export async function isLinkAllowedOnDomain(
    supabase: SupabaseClient,
    hostname: string,
    code: string,
): Promise<boolean> {
    const [{ data: domain }, { data: link }] = await Promise.all([
        supabase
            .from('domains')
            .select('user_id')
            .eq('domain', hostname.toLowerCase())
            .eq('status', 'active')
            .maybeSingle(),
        supabase
            .from('links')
            .select('user_id, team_id')
            .eq('short_code', code)
            .maybeSingle(),
    ]);

    if (!domain || !link) return false;
    if (link.user_id === domain.user_id) return true;
    if (!link.team_id) return false;

    const [{ data: membership }, { data: team }] = await Promise.all([
        supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', link.team_id)
            .eq('user_id', domain.user_id)
            .maybeSingle(),
        supabase
            .from('teams')
            .select('owner_id')
            .eq('id', link.team_id)
            .maybeSingle(),
    ]);

    return !!membership || team?.owner_id === domain.user_id;
}
