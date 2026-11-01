import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks -----------------------------------------------------------------

const state = vi.hoisted(() => ({
    user: null as any,
    welcomeSentAt: null as string | null,
    updates: [] as any[],
    sendResult: { data: { id: 'email_1' }, error: null } as any,
    sent: [] as any[],
}));

vi.mock('../_lib/supabaseServer', () => {
    // profiles table with one row whose welcome_email_sent_at is state.welcomeSentAt
    const from = (table: string) => {
        const filters: Record<string, unknown> = {};
        let pendingUpdate: any = null;
        const q: any = {
            select: () => q,
            update: (values: any) => { pendingUpdate = values; return q; },
            eq: (c: string, v: unknown) => { filters[c] = v; return q; },
            is: (c: string, v: unknown) => { filters[`is:${c}`] = v; return thenable(); },
            maybeSingle: async () => ({ data: table === 'profiles' ? { username: 'newbie' } : null, error: null }),
        };
        // update(...).eq(...) without .is(...) (the release) resolves on await
        q.then = (resolve: any) => {
            if (pendingUpdate) {
                state.updates.push(pendingUpdate);
                if ('welcome_email_sent_at' in pendingUpdate) state.welcomeSentAt = pendingUpdate.welcome_email_sent_at;
            }
            resolve({ data: null, error: null });
        };
        const thenable = () => ({
            select: async () => {
                // conditional claim: only succeeds while still null
                if (state.welcomeSentAt !== null) return { data: [], error: null };
                state.updates.push(pendingUpdate);
                state.welcomeSentAt = pendingUpdate.welcome_email_sent_at;
                return { data: [{ id: state.user.id }], error: null };
            },
        });
        return q;
    };
    return {
        getAdminClient: () => ({ from }),
        getUserFromRequest: async () => state.user,
    };
});

vi.mock('resend', () => ({
    Resend: class {
        emails = {
            send: async (msg: any) => {
                state.sent.push(msg);
                return state.sendResult;
            },
        };
    },
}));

import handler from '../send-email';

function call() {
    const res: any = {
        statusCode: 0,
        body: undefined,
        status(code: number) { this.statusCode = code; return this; },
        json(body: unknown) { this.body = body; return this; },
    };
    const req: any = { method: 'POST', headers: {}, body: { type: 'welcome' } };
    return Promise.resolve(handler(req, res)).then(() => res);
}

// --- tests -----------------------------------------------------------------

describe('send-email welcome', () => {
    beforeEach(() => {
        process.env.RESEND_API_KEY = 'test';
        state.user = { id: 'u1', email: 'new@example.com', email_confirmed_at: '2026-11-01T00:00:00Z' };
        state.welcomeSentAt = null;
        state.updates = [];
        state.sent = [];
        state.sendResult = { data: { id: 'email_1' }, error: null };
    });

    it('sends once to a confirmed user and records it', async () => {
        const res = await call();
        expect(res.statusCode).toBe(200);
        expect(state.sent).toHaveLength(1);
        expect(state.sent[0].to).toBe('new@example.com');
        expect(state.welcomeSentAt).not.toBeNull();
    });

    it('skips without sending when it already went out', async () => {
        await call();
        const second = await call();
        expect(second.statusCode).toBe(200);
        expect(second.body).toEqual({ skipped: 'already_sent' });
        expect(state.sent).toHaveLength(1);
    });

    it('refuses before the email is confirmed', async () => {
        state.user.email_confirmed_at = null;
        const res = await call();
        expect(res.statusCode).toBe(400);
        expect(state.sent).toHaveLength(0);
        expect(state.welcomeSentAt).toBeNull();
    });

    it('releases the claim when sending fails, so a later sign-in retries', async () => {
        state.sendResult = { data: null, error: { message: 'down' } };
        const failed = await call();
        expect(failed.statusCode).toBe(502);
        expect(state.welcomeSentAt).toBeNull();

        state.sendResult = { data: { id: 'email_2' }, error: null };
        const retried = await call();
        expect(retried.statusCode).toBe(200);
        expect(state.sent).toHaveLength(2);
        expect(state.welcomeSentAt).not.toBeNull();
    });
});
