import { errorFingerprint, isIgnoredError } from '../../utils/errorFingerprint';

export interface ErrorRecord {
    source: 'browser' | 'server';
    message: string;
    stack?: string | null;
    path?: string | null;
    release?: string | null;
    userAgent?: string | null;
}

/**
 * Save one occurrence to public.error_log (grouped by fingerprint). Never
 * throws: logging an error must not cause another one.
 */
export async function recordError(e: ErrorRecord): Promise<boolean> {
    try {
        if (!e.message || isIgnoredError(e.message, e.stack)) return false;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) return false;
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/record_error`, {
            method: 'POST',
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                p_fingerprint: await errorFingerprint(e.source, e.message, e.stack),
                p_source: e.source,
                p_message: e.message.slice(0, 1000),
                p_stack: e.stack ? e.stack.slice(0, 4000) : null,
                p_path: e.path ?? null,
                p_release: e.release ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
                p_user_agent: e.userAgent ? e.userAgent.slice(0, 300) : null,
            }),
        });
        return res.ok;
    } catch (err) {
        console.error('[error-log] could not record error:', err);
        return false;
    }
}

/** For API handlers' catch blocks: log to the console and to error_log. */
export async function recordServerError(where: string, error: unknown, request?: Request): Promise<void> {
    const err = error instanceof Error ? error : new Error(String(error));
    let path = where;
    if (request) {
        try { path = new URL(request.url).pathname; } catch { /* keep where */ }
    }
    await recordError({ source: 'server', message: `${where}: ${err.message}`, stack: err.stack, path });
}
