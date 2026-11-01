import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock('../storage/supabaseClient', () => ({
    supabase: { rpc: db.rpc, from: db.from, auth: { getSession: async () => ({ data: { session: null } }) } },
    isSupabaseConfigured: () => true,
    TABLES: {},
}));

import { TeamRepository } from '../storage/repositories/TeamRepository';

describe('TeamRepository.acceptInvite', () => {
    beforeEach(() => {
        db.rpc.mockReset();
        db.from.mockReset();
    });

    it('accepts through the accept_team_invite database function, not direct table writes', async () => {
        db.rpc.mockResolvedValue({ data: 'team-1', error: null });

        await new TeamRepository().acceptInvite('tok-123', 'user-1');

        expect(db.rpc).toHaveBeenCalledWith('accept_team_invite', { p_token: 'tok-123' });
        // Invitees can't read team_invites or insert into team_members under RLS.
        expect(db.from).not.toHaveBeenCalled();
    });

    it("surfaces the database's reason when an invite can't be accepted", async () => {
        db.rpc.mockResolvedValue({ data: null, error: { message: 'This invite was sent to a different email address' } });

        await expect(new TeamRepository().acceptInvite('tok-123')).rejects.toThrow('different email address');
    });
});
