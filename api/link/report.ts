import { hashIp } from '../../utils/ipHash';
import { simpleLimit } from '../_lib/simpleLimit';

/**
 * Report a short link (phishing, malware, spam, ...). Anyone can report;
 * reports go to link_reports for the admins (migrations/20261117_link_reports.sql).
 * 5 reports per visitor per hour.
 *
 * POST {code, reason, details?} -> 200 {ok} | 400 | 404 | 429
 */
export const config = { runtime: 'edge' };

export const REPORT_REASONS = ['phishing', 'malware', 'spam', 'scam', 'adult', 'other'] as const;
export const reportLimit = simpleLimit('link-report', 5, '1 h');

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** The short code from "abc", "/abc", "links.trak.in/abc" or "https://links.trak.in/r/abc?x". */
export function codeFromInput(raw: string): string {
    let s = raw.trim();
    try {
        const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
        if (u.hostname.includes('.')) s = u.pathname;
    } catch { /* plain code */ }
    const parts = s.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    try { return decodeURIComponent(last); } catch { return last; }
}

export default async function handler(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let body: { code?: unknown; reason?: unknown; details?: unknown };
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400);
    }
    const code = typeof body.code === 'string' ? codeFromInput(body.code) : '';
    const reason = body.reason;
    const details = typeof body.details === 'string' ? body.details.trim().slice(0, 1000) : '';
    if (!code || code.length > 100) return json({ error: 'Enter the short link you want to report.' }, 400);
    if (typeof reason !== 'string' || !(REPORT_REASONS as readonly string[]).includes(reason)) {
        return json({ error: 'Choose a reason.' }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return json({ error: 'Not configured' }, 503);
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const reporter = (await hashIp(ip, process.env.IP_HASH_SALT || serviceKey)) ?? 'unknown';
    const allowed = await reportLimit.allow(reporter);
    if (!allowed.ok) return json({ error: 'You have sent several reports already. Please try again later.' }, 429);

    const found = await fetch(`${supabaseUrl}/rest/v1/links?select=id&short_code=eq.${encodeURIComponent(code)}&limit=1`, { headers });
    const rows = found.ok ? ((await found.json()) as { id: string }[]) : [];
    if (!rows[0]) return json({ error: "We couldn't find that short link. Check it and try again." }, 404);

    const saved = await fetch(`${supabaseUrl}/rest/v1/link_reports`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ link_id: rows[0].id, reason, details: details || null, reporter }),
    });
    if (!saved.ok) {
        console.error('[link-report] insert failed:', saved.status, await saved.text());
        return json({ error: 'Could not send the report' }, 500);
    }
    return json({ ok: true });
}
