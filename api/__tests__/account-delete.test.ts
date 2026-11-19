import { describe, it, expect, vi, beforeEach } from 'vitest';

const s = vi.hoisted(() => ({
    user: { id: 'u1', email: 'Asha@Example.com' } as { id: string; email: string } | null,
    tier: 'free' as string | null,
    calls: [] as string[],
    kvDel: vi.fn(),
    deleteUserError: null as unknown,
    linksError: null as unknown,
}));

vi.mock('@vercel/kv', () => ({ kv: { del: s.kvDel } }));
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        auth: {
            getUser: async () => ({ data: { user: s.user }, error: s.user ? null : { message: 'bad' } }),
            admin: { deleteUser: async (id: string) => { s.calls.push(`deleteUser:${id}`); return { error: s.deleteUserError }; } },
        },
        from: (table: string) => ({
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { subscription_tier: s.tier } }) }) }),
            delete: () => ({
                eq: (_c: string, v: string) => ({
                    select: async () => { s.calls.push(`delete:${table}:${v}`); return { data: s.linksError ? null : [{ short_code: 'a1' }, { short_code: 'b2' }], error: s.linksError }; },
                }),
            }),
        }),
        storage: {
            from: (bucket: string) => ({
                list: async () => ({ data: bucket === 'avatars' ? [{ name: 'me.png' }] : [] }),
                remove: async (paths: string[]) => { s.calls.push(`remove:${bucket}:${paths.join(',')}`); return {}; },
            }),
        },
    }),
}));

import handler from '../account/delete';

const call = (body: unknown, auth = 'Bearer t') =>
    handler(new Request('https://links.trak.in/api/account/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(body),
    }));

describe('/api/account/delete', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
        s.user = { id: 'u1', email: 'Asha@Example.com' }; s.tier = 'free'; s.calls = []; s.kvDel.mockReset();
        s.deleteUserError = null; s.linksError = null;
    });

    it('needs a signed-in user', async () => {
        expect((await call({ confirmEmail: 'asha@example.com' }, '')).status).toBe(401);
        s.user = null;
        expect((await call({ confirmEmail: 'asha@example.com' })).status).toBe(401);
        expect(s.calls).toEqual([]);
    });

    it('needs the account email typed to confirm', async () => {
        expect((await call({ confirmEmail: 'someone@else.com' })).status).toBe(400);
        expect((await call({})).status).toBe(400);
        expect(s.calls).toEqual([]);
    });

    it('refuses paid plans without deleting anything', async () => {
        s.tier = 'pro';
        const res = await call({ confirmEmail: 'asha@example.com' });
        expect(res.status).toBe(409);
        expect((await res.json()).error).toBe('paid_plan');
        expect(s.calls).toEqual([]);
    });

    it('deletes links, their cache entries, files, then the user', async () => {
        const res = await call({ confirmEmail: '  ASHA@example.com ' });
        expect(res.status).toBe(200);
        expect(s.calls).toEqual(['delete:links:u1', 'remove:avatars:u1/me.png', 'deleteUser:u1']);
        expect(s.kvDel).toHaveBeenCalledWith('gather:link:a1', 'gather:link:b2');
    });

    it('stops before deleting the user if the links can\'t be deleted', async () => {
        s.linksError = { message: 'boom' };
        expect((await call({ confirmEmail: 'asha@example.com' })).status).toBe(500);
        expect(s.calls).toEqual(['delete:links:u1']);
    });

    it('reports a failed user delete', async () => {
        s.deleteUserError = { message: 'nope' };
        expect((await call({ confirmEmail: 'asha@example.com' })).status).toBe(500);
    });
});
