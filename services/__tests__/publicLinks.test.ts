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

    it('checks link passwords on the server', async () => {
        db.rpc.mockResolvedValueOnce({ data: null, error: null });
        expect(await new LinkRepository().unlockLink('abc', 'wrong')).toBeNull();
        db.rpc.mockResolvedValueOnce({ data: row({ requires_password: true }), error: null });
        const link = await new LinkRepository().unlockLink('abc', 'right');
        expect(db.rpc).toHaveBeenLastCalledWith('unlock_link', { p_short_code: 'abc', p_password: 'right' });
        expect(link?.originalUrl).toBe('https://example.com');
    });

    it('finds a guest link by claim token through get_guest_link_by_claim_token', async () => {
        db.rpc.mockResolvedValue({ data: row({ is_guest: true }), error: null });
        await new LinkRepository().getGuestLinkByToken('tok');
        expect(db.rpc).toHaveBeenCalledWith('get_guest_link_by_claim_token', { p_token: 'tok' });
        expect(db.from).not.toHaveBeenCalled();
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
