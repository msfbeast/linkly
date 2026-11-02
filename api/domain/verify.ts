import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as dns } from 'dns';
import { getAdminClient, getUserFromRequest } from '../_lib/supabaseServer';

/**
 * Verify a custom domain and mark it active.
 *
 * The DNS check runs here, and only the server (service role) can set a
 * domain's status: a database trigger stops clients doing it directly.
 * Several users may have a pending claim on the same domain. Pointing the
 * CNAME at us isn't proof of ownership (cname.vercel-dns.com is shared by
 * every Vercel customer, and a CNAME left behind after someone removes a
 * domain keeps pointing here), so the claimant must also publish their own
 * token: TXT _gather.<domain> = "gather-verification=<token>".
 */

// Must match the instructions shown in components/DomainManager.tsx
const EXPECTED_TARGETS = ['custom.gather.link', 'cname.vercel-dns.com'];

const normalize = (name: string) => name.toLowerCase().replace(/\.$/, '');

// Must match components/DomainManager.tsx
export const TXT_PREFIX = '_gather';
export const txtValue = (token: string) => `gather-verification=${token}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabase = getAdminClient();
    if (!supabase) {
        console.error('[DomainVerify] Server misconfiguration');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { domainId } = req.body || {};
    if (!domainId || typeof domainId !== 'string') {
        return res.status(400).json({ error: 'Missing domainId' });
    }

    const { data: domainRow } = await supabase
        .from('domains')
        .select('id, user_id, domain, status, verification_token')
        .eq('id', domainId)
        .maybeSingle();

    if (!domainRow || domainRow.user_id !== user.id) {
        return res.status(404).json({ error: 'Domain not found' });
    }
    if (domainRow.status === 'active') {
        return res.status(200).json({ verified: true, domain: domainRow });
    }

    const domain = normalize(domainRow.domain);

    let records: string[] = [];
    try {
        records = (await dns.resolveCname(domain)).map(normalize);
    } catch (error: any) {
        if (error?.code !== 'ENODATA' && error?.code !== 'ENOTFOUND') {
            console.error(`[DomainVerify] DNS lookup failed for ${domain}:`, error);
            return res.status(502).json({ verified: false, error: 'DNS lookup failed, try again shortly' });
        }
    }

    if (!records.some(r => EXPECTED_TARGETS.includes(r))) {
        return res.status(200).json({
            verified: false,
            error: `CNAME for ${domain} does not point to ${EXPECTED_TARGETS[0]}`,
            records,
        });
    }

    // Proof the claimant controls the domain's DNS: their own token in TXT.
    const txtName = `${TXT_PREFIX}.${domain}`;
    let txt: string[] = [];
    try {
        txt = (await dns.resolveTxt(txtName)).map(chunks => chunks.join('').trim());
    } catch (error: any) {
        if (error?.code !== 'ENODATA' && error?.code !== 'ENOTFOUND') {
            console.error(`[DomainVerify] TXT lookup failed for ${txtName}:`, error);
            return res.status(502).json({ verified: false, error: 'DNS lookup failed, try again shortly' });
        }
    }
    if (!domainRow.verification_token || !txt.includes(txtValue(domainRow.verification_token))) {
        return res.status(200).json({
            verified: false,
            error: `TXT record ${txtName} must be "${txtValue(domainRow.verification_token ?? '')}"`,
        });
    }

    // Someone else may already have this domain live.
    const { data: activeClaim } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain)
        .eq('status', 'active')
        .neq('id', domainRow.id)
        .maybeSingle();

    if (activeClaim) {
        return res.status(409).json({ verified: false, error: 'This domain is already connected to another account' });
    }

    const { data: updated, error: updateError } = await supabase
        .from('domains')
        .update({ status: 'active', verified_at: new Date().toISOString() })
        .eq('id', domainRow.id)
        .select('*')
        .single();

    if (updateError) {
        // Unique index on active domains: another claim won the race.
        if (updateError.code === '23505') {
            return res.status(409).json({ verified: false, error: 'This domain is already connected to another account' });
        }
        console.error('[DomainVerify] Update failed:', updateError);
        return res.status(500).json({ verified: false, error: 'Failed to activate domain' });
    }

    // Drop other users' stale pending claims for the same domain.
    await supabase
        .from('domains')
        .delete()
        .eq('domain', domain)
        .neq('id', domainRow.id)
        .neq('status', 'active');

    return res.status(200).json({ verified: true, domain: updated });
}
