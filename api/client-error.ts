import { hashIp } from '../utils/ipHash';
import { cleanPath } from '../utils/errorFingerprint';
import { simpleLimit } from './_lib/simpleLimit';
import { recordError } from './_lib/errorLog';

/**
 * Browser error reports (utils/errorReporter.ts) -> public.error_log.
 * 30 per visitor per 10 minutes; everything is truncated and the page
 * address is reduced to its path.
 *
 * POST {message, stack?, path?, release?} -> 204
 */
export const config = { runtime: 'edge' };

export const errorReportLimit = simpleLimit('client-error', 30, '10 m');

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    let body: { message?: unknown; stack?: unknown; path?: unknown; release?: unknown };
    try {
        body = await request.json();
    } catch {
        return new Response(null, { status: 400 });
    }
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return new Response(null, { status: 400 });

    const salt = process.env.IP_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'gather';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const visitor = (await hashIp(ip, salt)) ?? 'unknown';
    if (!(await errorReportLimit.allow(visitor)).ok) return new Response(null, { status: 429 });

    await recordError({
        source: 'browser',
        message,
        stack: typeof body.stack === 'string' ? body.stack : null,
        path: cleanPath(typeof body.path === 'string' ? body.path : null),
        release: typeof body.release === 'string' ? body.release.slice(0, 64) : null,
        userAgent: request.headers.get('user-agent'),
    });
    return new Response(null, { status: 204 });
}
