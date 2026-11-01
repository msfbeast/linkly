import { kv } from '@vercel/kv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isMainDomain, deploymentHosts } from '../../utils/mainDomains';
import { isLinkAllowedOnDomain } from '../_lib/customDomainAccess';
import { recordClick, clickStoreEnvFromProcess, type ClickEvent } from '../_lib/clickStore';
import { geoFromVercelHeaders } from '../../utils/geoNames';
import { isBot, isMobileUserAgent } from '../_lib/botFilter';
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
 * The app's own URL for hand-offs to the browser redirect page (/go, /unlock).
 * On a main domain, that domain; on a custom domain, NEXT_PUBLIC_APP_URL or
 * links.trak.in.
 */
const getAppUrl = (requestUrl: URL): string => {
    // Stay on the main domain the visitor came in on: hand-offs to /go and
    // /unlock must not hop to another domain (gather.link currently serves
    // a Firebase 404, so a hard-coded or configured hop there breaks links).
    if (isMainDomain(requestUrl.hostname, deploymentHosts())) return requestUrl.origin;
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    return 'https://links.trak.in';
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
            const appUrl = getAppUrl(url);
            const userAgent = request.headers.get('user-agent');

            // 1. Restricted or targeted links (password, expiry, start date,
            //    click limit, A/B / device / country destinations) go to the
            //    browser redirect page, which explains, asks or picks the
            //    destination, and counts the click itself.
            //    IMPORTANT: /unlock/:code, NOT /r/:code — vercel.json rewrites
            //    /r/:code straight back to this function (redirect loop).
            if (redirectDecision(linkData) === 'interstitial') {
                return Response.redirect(`${appUrl}/unlock/${code}`, 307);
            }

            // 2. Phones and tablets also go to the browser redirect page: it
            //    opens Amazon, Flipkart, YouTube, Instagram... in their apps
            //    (keeping affiliate tags) and breaks out of in-app browsers.
            //    It counts the click, so it isn't counted here.
            if (isMobileUserAgent(userAgent)) {
                return Response.redirect(`${appUrl}/go/${code}`, 307);
            }

            // 3. Desktop: redirect straight away and count the click, unless a
            //    link-preview bot or crawler is fetching it (or it's a HEAD).
            if (request.method !== 'HEAD' && !isBot(userAgent)) {
                const geo = geoFromVercelHeaders(request.headers);
                const clickEvent: ClickEvent = {
                    linkId: linkData.id,
                    timestamp: Date.now(),
                    userAgent,
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
                    clickStoreEnvFromProcess(`${appUrl}/api/queue/process-click`),
                );
                if (context?.waitUntil) {
                    context.waitUntil(recording);
                } else {
                    await recording;
                }
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
