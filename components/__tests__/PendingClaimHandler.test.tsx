import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
    user: null as null | { id: string },
    claim: vi.fn(),
    success: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: { claimGuestLink: mocks.claim } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success } }));

import PendingClaimHandler from '../PendingClaimHandler';
import { getPendingClaim, setPendingClaim } from '../../utils/pendingClaim';

const mount = (path = '/dashboard') =>
    render(<MemoryRouter initialEntries={[path]}><PendingClaimHandler /></MemoryRouter>);

describe('PendingClaimHandler', () => {
    beforeEach(() => {
        localStorage.clear();
        mocks.user = null;
        mocks.claim.mockReset();
        mocks.success.mockReset();
    });

    it('does nothing until someone is signed in', () => {
        setPendingClaim('tok');
        mount();
        expect(mocks.claim).not.toHaveBeenCalled();
        expect(getPendingClaim()).toBe('tok');
    });

    it('claims the pending link for the signed-in user and forgets the token', async () => {
        setPendingClaim('tok');
        mocks.user = { id: 'u1' };
        mocks.claim.mockResolvedValue({ shortCode: 'abc' });
        mount();
        await waitFor(() => expect(mocks.success).toHaveBeenCalled());
        expect(mocks.claim).toHaveBeenCalledWith('tok', 'u1');
        expect(getPendingClaim()).toBeNull();
    });

    it('drops a token the server refuses, keeps it after a network failure', async () => {
        setPendingClaim('tok');
        mocks.user = { id: 'u1' };
        mocks.claim.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const first = mount();
        await waitFor(() => expect(mocks.claim).toHaveBeenCalledTimes(1));
        await Promise.resolve();
        expect(getPendingClaim()).toBe('tok');
        first.unmount();

        mocks.claim.mockRejectedValueOnce({ message: 'Invalid or expired claim token.' });
        mount();
        await waitFor(() => expect(getPendingClaim()).toBeNull());
    });

    it('leaves the claim page to claim on its own', () => {
        setPendingClaim('tok');
        mocks.user = { id: 'u1' };
        mount('/claim/tok');
        expect(mocks.claim).not.toHaveBeenCalled();
    });
});
