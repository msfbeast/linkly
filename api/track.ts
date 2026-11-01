import { geoFromVercelHeaders } from '../utils/geoNames';
import { storeClick, clickStoreEnvFromProcess, type ClientDetails, type ClickEvent } from './_lib/clickStore';

/**
 * Click tracking for the in-app redirect page (pages/Redirect.tsx).
 *
 * Replaces the Supabase track-click function, which sent every visitor's
 * IP to ip-api.com over plain HTTP. Location now comes from Vercel's own
 * geo headers, the IP never leaves our infrastructure and is stored only
 * as a keyed hash, and device details are parsed here.
 */
export const config = { runtime: 'edge' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const int = (v: unknown, max = 100_000) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : null;
const str = (v: unknown, max = 200) =>
    typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null;
const bool = (v: unknown) => (typeof v === 'boolean' ? v : null);

function clientDetails(body: Record<string, unknown>): ClientDetails {
    const destination = str(body.destinationUrl, 2048);
    return {
        screenWidth: int(body.screenWidth),
        screenHeight: int(body.screenHeight),
        colorDepth: int(body.colorDepth, 64),
        timezone: str(body.timezone, 64),
        language: str(body.language, 35),
        platform: str(body.platform, 64),
        cookiesEnabled: bool(body.cookiesEnabled),
        doNotTrack: bool(body.doNotTrack),
        deviceModel: str(body.deviceModel, 100),
        destinationUrl: destination && /^https?:\/\//i.test(destination) ? destination : null,
    };
}

async function linkExists(linkId: string, supabaseUrl: string, serviceKey: string): Promise<boolean> {
    const res = await fetch(`${supabaseUrl}/rest/v1/links?id=eq.${linkId}&select=id`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }
    if (!body || typeof body !== 'object') return json({ error: 'Invalid body' }, 400);

    const linkId = typeof body.linkId === 'string' ? body.linkId : '';
    if (!UUID.test(linkId)) return json({ error: 'Invalid linkId' }, 400);

    const env = clickStoreEnvFromProcess();
    if (!env.supabaseUrl || !env.serviceKey) return json({ error: 'Not configured' }, 503);
    if (!(await linkExists(linkId, env.supabaseUrl, env.serviceKey))) return json({ error: 'Link not found' }, 404);

    const geo = geoFromVercelHeaders(request.headers);
    const event: ClickEvent = {
        linkId,
        timestamp: Date.now(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        referrer: str(body.referrer, 2048),
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
        client: clientDetails(body),
    };

    const result = await storeClick(event, env);
    if (!result.ok) {
        console.error('[track] Failed to store click:', result.error);
        return json({ error: 'Failed to record click' }, 500);
    }
    return json({ success: true });
}
