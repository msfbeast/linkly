import { hashIp } from '../../utils/ipHash';

/**
 * Recording a click from the edge redirect (api/r) and the QStash worker
 * (api/queue/process-click). Uses the Supabase REST API directly so it runs
 * in the edge runtime.
 */

export interface ClickEvent {
    linkId: string;
    timestamp: number;
    userAgent: string | null;
    ip: string | null;
    referrer: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
}

export interface ClickStoreEnv {
    supabaseUrl?: string;
    serviceKey?: string;
    /** IP_HASH_SALT; falls back to the service key, as everywhere else. */
    ipHashSalt?: string;
    /** "qstash" to queue through QStash; anything else stores directly. */
    clickQueue?: string;
    qstashUrl?: string;
    qstashToken?: string;
    /** Absolute URL QStash should deliver to (…/api/queue/process-click). */
    workerUrl?: string;
}

export function clickStoreEnvFromProcess(workerUrl?: string): ClickStoreEnv {
    return {
        supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        ipHashSalt: process.env.IP_HASH_SALT,
        clickQueue: process.env.CLICK_QUEUE,
        qstashUrl: process.env.QSTASH_URL,
        qstashToken: process.env.QSTASH_TOKEN,
        workerUrl,
    };
}

const toNumber = (v: string | number | null) => {
    if (v === null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
};

/** Insert the click and bump the link's counter. */
export async function storeClick(event: ClickEvent, env: ClickStoreEnv): Promise<{ ok: boolean; error?: string }> {
    const { supabaseUrl, serviceKey } = env;
    if (!supabaseUrl || !serviceKey) return { ok: false, error: 'Supabase not configured' };

    const headers = {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
    };
    const at = new Date(event.timestamp).toISOString();

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/click_events`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
            link_id: event.linkId,
            timestamp: at,
            raw_user_agent: event.userAgent,
            ip_hash: await hashIp(event.ip, env.ipHashSalt || serviceKey),
            country: event.country,
            city: event.city,
            region: event.region,
            latitude: toNumber(event.latitude),
            longitude: toNumber(event.longitude),
            referrer: event.referrer,
        }),
    });
    if (!insertRes.ok) return { ok: false, error: `insert ${insertRes.status}: ${await insertRes.text()}` };

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_link_clicks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ link_id: event.linkId, clicked_at: at }),
    });
    if (!rpcRes.ok) {
        await fetch(`${supabaseUrl}/rest/v1/rpc/increment_clicks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ link_id: event.linkId }),
        });
    }
    return { ok: true };
}

/**
 * Record a click. Stores it directly unless CLICK_QUEUE=qstash, in which
 * case it is published to QStash and stored directly if publishing fails.
 *
 * Direct is the default because the queue failed silently in production:
 * QStash accepts a publish even when it later can't deliver it (wrong
 * worker host, worker rejecting deliveries), so clicks were lost without
 * any error here.
 */
export async function recordClick(event: ClickEvent, env: ClickStoreEnv): Promise<'queued' | 'stored' | 'failed'> {
    if (env.clickQueue === 'qstash') {
        if (env.qstashUrl && env.qstashToken && env.workerUrl) {
            try {
                const res = await fetch(`${env.qstashUrl}/v2/publish/${env.workerUrl}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${env.qstashToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(event),
                });
                if (res.ok) return 'queued';
                console.error(`[clicks] QStash publish failed (${res.status}); storing directly`);
            } catch (e) {
                console.error('[clicks] QStash publish error; storing directly', e);
            }
        } else {
            console.error('[clicks] CLICK_QUEUE=qstash but QSTASH_URL/QSTASH_TOKEN missing; storing directly');
        }
    }

    try {
        const result = await storeClick(event, env);
        if (result.ok) return 'stored';
        console.error('[clicks] Failed to store click:', result.error);
    } catch (e) {
        console.error('[clicks] Failed to store click:', e);
    }
    return 'failed';
}
