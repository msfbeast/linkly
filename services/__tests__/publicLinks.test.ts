import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock('../storage/supabaseClient', () => ({
    supabase: { rpc: db.rpc, from: db.from, auth: { getSession: async () => ({ data: { session: null } }) } },
    isSupabaseConfigured: () => true,
    TABLES: { LINKS: 'links', CLICK_EVENTS: 'click_events' },
}));

import { LinkRepository } from '../storage/repositories/LinkRepository';
import { rowToLinkData } from '../storage/mappers';

const row = (extra: Record<string, unknown> = {}) => ({
    id: 'l1', original_url: 'https://example.com', short_code: 'abc', title: 'T', tags: [],
    created_at: '2026-11-01T00:00:00Z', clicks: 0, max_clicks: null, password_hash: null, ...extra,
});

describe('public link reads', () => {
    beforeEach(() => { db.rpc.mockReset(); db.from.mockReset(); });

    it('resolves a short code through get_public_link, never the links table', async () => {
        db.rpc.mockResolvedValue({ data: row(), error: null });
        const link = await new LinkRepository().getLinkByCode('abc');
        expect(db.rpc).toHaveBeenCalledWith('get_public_link', { p_short_code: 'abc' });
        expect(db.from).not.toHaveBeenCalled();
        expect(link?.originalUrl).toBe('https://example.com');
    });

    it('loads bio links through get_public_links', async () => {
        db.rpc.mockResolvedValue({ data: [row(), row({ id: 'l2', short_code: 'def' })], error: null });
        const links = await new LinkRepository().getPublicLinks(['l1', 'l2']);
        expect(db.rpc).toHaveBeenCalledWith('get_public_links', { p_ids: ['l1', 'l2'] });
        expect(links.map((l) => l.shortCode)).toEqual(['abc', 'def']);
        expect(db.from).not.toHaveBeenCalled();
    });

    it('checks link passwords through the rate-limited unlock endpoint', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'wrong_password' }), { status: 401 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ link: row({ requires_password: true }) })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'too_many_attempts' }), { status: 429 }));
        vi.stubGlobal('fetch', fetchMock);
        try {
            const repo = new LinkRepository();
            expect(await repo.unlockLink('abc', 'wrong')).toEqual({ status: 'wrong' });
            const ok = await repo.unlockLink('abc', 'right');
            expect(ok.status === 'ok' && ok.link.originalUrl).toBe('https://example.com');
            expect(await repo.unlockLink('abc', 'again')).toEqual({ status: 'limited' });
            expect(fetchMock).toHaveBeenCalledWith('/api/link/unlock', expect.objectContaining({ method: 'POST' }));
            expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ code: 'abc', password: 'right' });
            expect(db.rpc).not.toHaveBeenCalled();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('finds a guest link by claim token through get_guest_link_by_claim_token', async () => {
        db.rpc.mockResolvedValue({ data: row({ is_guest: true }), error: null });
        await new LinkRepository().getGuestLinkByToken('tok');
        expect(db.rpc).toHaveBeenCalledWith('get_guest_link_by_claim_token', { p_token: 'tok' });
        expect(db.from).not.toHaveBeenCalled();
    });
});

describe('guest link claiming', () => {
    beforeEach(() => { db.rpc.mockReset(); db.from.mockReset(); });

    it('keeps the claim token create_guest_link returns', async () => {
        db.rpc
            .mockResolvedValueOnce({ data: { id: 'l1', claim_token: 'tok-1' }, error: null }) // create_guest_link
            .mockResolvedValueOnce({ data: row({ is_guest: true }), error: null });          // get_public_link
        const link = await new LinkRepository().createGuestLink('https://example.com', 'sess');
        expect(db.rpc.mock.calls[0][0]).toBe('create_guest_link');
        expect(link.claimToken).toBe('tok-1');
    });

    it('claims through claim_guest_link, never by updating the links table', async () => {
        db.rpc.mockResolvedValueOnce({ data: { success: true, link_id: 'l1' }, error: null });
        const repo = new LinkRepository();
        const getLink = vi.spyOn(repo, 'getLink').mockResolvedValue(rowToLinkData(row() as any));
        const link = await repo.claimGuestLink('tok-1', 'user-1');
        expect(db.rpc).toHaveBeenCalledWith('claim_guest_link', { p_claim_token: 'tok-1', p_user_id: 'user-1' });
        expect(getLink).toHaveBeenCalledWith('l1');
        expect(db.from).not.toHaveBeenCalled();
        expect(link.shortCode).toBe('abc');
    });

    it('surfaces a refused claim', async () => {
        db.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Invalid or expired claim token.' } });
        await expect(new LinkRepository().claimGuestLink('bad', 'user-1')).rejects.toMatchObject({ message: 'Invalid or expired claim token.' });
    });

    it('sends the guest session id with the guest email', async () => {
        db.rpc.mockResolvedValueOnce({ data: null, error: null });
        await new LinkRepository().updateGuestEmail('l1', 'g@example.com', 'sess');
        expect(db.rpc).toHaveBeenCalledWith('update_guest_link_metadata', { p_link_id: 'l1', p_email: 'g@example.com', p_session_id: 'sess' });
    });
});

describe('rowToLinkData password field', () => {
    it('marks a locked public link as protected without any password value', () => {
        expect(rowToLinkData(row({ original_url: '', requires_password: true }) as any).password).toBe('protected');
    });
    it('passes the stored value through for owners and null when unprotected', () => {
        expect(rowToLinkData(row({ password_hash: '$2a$10$x' }) as any).password).toBe('$2a$10$x');
        expect(rowToLinkData(row() as any).password).toBeNull();
    });
});
