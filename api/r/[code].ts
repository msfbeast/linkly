import { kv } from '@vercel/kv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isMainDomain, deploymentHosts } from '../../utils/mainDomains';
import { isLinkAllowedOnDomain } from '../_lib/customDomainAccess';
import { recordClick, clickStoreEnvFromProcess, type ClickEvent } from '../_lib/clickStore';
import { geoFromVercelHeaders } from '../../utils/geoNames';
import {
    type KvLinkData, type LinkCacheRow, LINK_CACHE_COLUMNS, LINK_CACHE_TTL_SECONDS,
    linkCacheKey, toCacheEntry, redirectDecision,
} from '../_lib/linkCache';

export const config = {
    runtime: 'edge',
};

// A slow cache or database shouldn't hang the visitor.
const KV_TIMEOUT_MS = 1500;
const DB_TIMEOUT_MS = 4000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number, what: string): Promise<T> {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms)),
    ]);
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

/** On a custom domain, only the owner's (or the owner's teams') links resolve. */
async function linkAllowedOnCustomDomain(hostname: string, code: string): Promise<boolean> {
    const supabase = getAdminClient();
    if (!supabase) {
        console.error('[Edge API] Custom domain check unavailable: missing Supabase env');
        return false;
    }
    return isLinkAllowedOnDomain(supabase, hostname, code);
}

/**
 * DB fallback when the KV cache misses or fails. Archived links and expired
 * guest links come back as null (not found). Rewarms the cache on success
 * unless the cache is the thing that just failed.
 */
async function lookupFromDatabase(code: string, rewarm: boolean): Promise<KvLinkData | null> {
    const supabase = getAdminClient();
    if (!supabase) {
        console.error('[Edge API] DB fallback unavailable: missing Supabase env');
        return null;
    }

    const { data: row, error } = await withTimeout(
        supabase.from('links').select(LINK_CACHE_COLUMNS).eq('short_code', code).maybeSingle(),
        DB_TIMEOUT_MS,
        'DB lookup',
    );
    if (error || !row) return null;

    const linkData = toCacheEntry(row as LinkCacheRow);
    if (!linkData) return null;

    if (rewarm) {
        try {
            await kv.set(linkCacheKey(code), linkData, { ex: LINK_CACHE_TTL_SECONDS });
        } catch (e) {
            console.error('[Edge API] KV rewarm failed:', e);
        }
    }

    return linkData;
}

export default async function handler(request: Request, context?: { waitUntil?: (promise: Promise<unknown>) => void }) {
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
        let linkData: KvLinkData | null = null;
        let kvHealthy = true;
        try {
            linkData = await withTimeout(kv.get<KvLinkData>(linkCacheKey(code)), KV_TIMEOUT_MS, 'KV get');
        } catch (e) {
            // A cache outage must not take every link down: use the database.
            kvHealthy = false;
            console.error('[Edge API] KV unavailable, using the database:', e);
        }
        if (!linkData || !linkData.url) {
            linkData = await lookupFromDatabase(code, kvHealthy);
        }

        if (linkData && redirectDecision(linkData) === 'gone') {
            if (kvHealthy) {
                try { await kv.del(linkCacheKey(code)); } catch { /* best effort */ }
            }
            linkData = null;
        }

        if (linkData && linkData.url && !isMainDomain(url.hostname, deploymentHosts()) &&
            !(await linkAllowedOnCustomDomain(url.hostname, code))) {
            linkData = null;
        }

        if (linkData && linkData.url) {
            // 1. Restrictions (password, expiry, start date, click limit) go
            //    to the /unlock page, which explains or asks, and counts the
            //    click itself once the visitor gets through.
            if (redirectDecision(linkData) === 'interstitial') {
                // Delegate to the React page which renders password/expiry UI.
                // IMPORTANT: use /unlock/:code, NOT /r/:code — vercel.json
                // rewrites /r/:code straight back to this function, which
                // previously caused an infinite redirect loop for every
                // password-protected or scheduled link.
                const appUrl = getAppUrl(url);
                return Response.redirect(`${appUrl}/unlock/${code}`, 307);
            }

            // 2. Record the click without delaying the redirect.
            const geo = geoFromVercelHeaders(request.headers);
            const clickEvent: ClickEvent = {
                linkId: linkData.id,
                timestamp: Date.now(),
                userAgent: request.headers.get('user-agent'),
                ip: request.headers.get('x-forwarded-for'),
                referrer: request.headers.get('referer'),
                country: geo.country,
                countryCode: geo.countryCode,
                city: geo.city,
                region: geo.region,
                latitude: geo.latitude,
                longitude: geo.longitude,
            };
            const recording = recordClick(
                clickEvent,
                clickStoreEnvFromProcess(`${getAppUrl(url)}/api/queue/process-click`),
            );
            if (context?.waitUntil) {
                context.waitUntil(recording);
            } else {
                await recording;
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
