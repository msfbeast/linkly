import { kv } from '@vercel/kv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isMainDomain, deploymentHosts } from '../../utils/mainDomains';

export const config = {
    runtime: 'edge',
};

interface KvLinkData {
    url: string;
    id: string;
    password?: boolean;
    expiration?: number;
    start?: number;
}


/**
 * Resolve the app's own URL for interstitial pages (/open, /unlock).
 * Prefers NEXT_PUBLIC_APP_URL; if unset and the request is already on a
 * main domain, use that origin (avoids a cross-domain hop for every
 * mobile click when the env var is missing).
 */
const getAppUrl = (requestUrl: URL): string => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (isMainDomain(requestUrl.hostname, deploymentHosts())) return requestUrl.origin;
    return 'https://gather.link';
};

function getAdminClient(): SupabaseClient | null {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return null;
    return createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * On a custom domain, only the domain owner's links may resolve. Otherwise
 * anyone's short code would work on anyone's branded domain.
 */
async function linkBelongsToDomainOwner(hostname: string, code: string): Promise<boolean> {
    const supabase = getAdminClient();
    if (!supabase) {
        console.error('[Edge API] Custom domain check unavailable: missing Supabase env');
        return false;
    }

    const [{ data: domain }, { data: link }] = await Promise.all([
        supabase
            .from('domains')
            .select('user_id')
            .eq('domain', hostname.toLowerCase())
            .eq('status', 'active')
            .maybeSingle(),
        supabase
            .from('links')
            .select('user_id')
            .eq('short_code', code)
            .maybeSingle(),
    ]);

    return !!domain && !!link && domain.user_id === link.user_id;
}

/** DB fallback when the KV cache misses; rewarms the cache on success. */
async function lookupFromDatabase(code: string): Promise<KvLinkData | null> {
    const supabase = getAdminClient();
    if (!supabase) {
        console.error('[Edge API] DB fallback unavailable: missing Supabase env');
        return null;
    }

    const { data: row, error } = await supabase
        .from('links')
        .select('id, original_url, password_hash, expiration_date, start_date')
        .eq('short_code', code)
        .maybeSingle();

    if (error || !row || !row.original_url) return null;

    const linkData: KvLinkData = {
        url: row.original_url,
        id: row.id,
        password: !!row.password_hash,
        expiration: row.expiration_date ?? undefined,
        start: row.start_date ?? undefined,
    };

    // Rewarm KV so the next click is fast (best-effort)
    try {
        await kv.set(`gather:link:${code}`, linkData);
    } catch (e) {
        console.error('[Edge API] KV rewarm failed:', e);
    }

    return linkData;
}

export default async function handler(request: Request) {
    const url = new URL(request.url);
    // When accessed via rewrite /r/foo -> /api/r/foo, parse the last segment.
    const pathSegments = url.pathname.split('/');
    const code = pathSegments[pathSegments.length - 1];

    if (!code) {
        return new Response('Missing code', { status: 400 });
    }

    try {
        // 1. Check Vercel KV; fall back to Supabase on miss (KV can be
        //    incomplete after failed syncs or cache flushes — links must
        //    not die because of a cache problem).
        let linkData = await kv.get<KvLinkData>(`gather:link:${code}`);
        if (!linkData || !linkData.url) {
            linkData = await lookupFromDatabase(code);
        }

        if (linkData && linkData.url && !isMainDomain(url.hostname, deploymentHosts()) &&
            !(await linkBelongsToDomainOwner(url.hostname, code))) {
            linkData = null;
        }

        if (linkData && linkData.url) {
            // Async Analytics: Publish to QStash
            try {
                const rawCity = request.headers.get('x-vercel-ip-city');
                const decodedCity = rawCity ? decodeURIComponent(rawCity) : null;

                const clickEvent = {
                    linkId: linkData.id,
                    timestamp: Date.now(),
                    userAgent: request.headers.get('user-agent'),
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                    referrer: request.headers.get('referer'),
                    country: request.headers.get('x-vercel-ip-country'),
                    city: decodedCity,
                    region: request.headers.get('x-vercel-ip-region'),
                    latitude: request.headers.get('x-vercel-ip-latitude'),
                    longitude: request.headers.get('x-vercel-ip-longitude'),
                };

                const appUrl = getAppUrl(url);
                const qstashRes = await fetch(`${process.env.QSTASH_URL}/v2/publish/${appUrl}/api/queue/process-click`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(clickEvent),
                });

                if (!qstashRes.ok) {
                    console.error(`[Edge API] QStash failed: ${qstashRes.status} ${await qstashRes.text()}`);
                }
            } catch (qError) {
                console.error('[Edge API] QStash Error:', qError);
                // Don't fail the redirect if analytics fails
            }

            // 2. Check Restrictions (Password, Expiration, Start Date)
            const now = Date.now();
            if (linkData.password ||
                (linkData.expiration && now > linkData.expiration) ||
                (linkData.start && now < linkData.start)) {
                // Delegate to the React page which renders password/expiry UI.
                // IMPORTANT: use /unlock/:code, NOT /r/:code — vercel.json
                // rewrites /r/:code straight back to this function, which
                // previously caused an infinite redirect loop for every
                // password-protected or scheduled link.
                const appUrl = getAppUrl(url);
                return Response.redirect(`${appUrl}/unlock/${code}`, 307);
            }

            // Smart Redirect for Mobile Users (to break out of in-app browsers)
            const userAgent = request.headers.get('user-agent') || '';
            const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);

            if (isMobile) {
                const appUrl = getAppUrl(url);
                const encodedTarget = encodeURIComponent(linkData.url);
                return Response.redirect(`${appUrl}/open/${encodedTarget}`, 307);
            }

            return Response.redirect(linkData.url, 307);
        } else {
            return new Response('Link not found', { status: 404 });
        }
    } catch (error) {
        console.error('[Edge API] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
