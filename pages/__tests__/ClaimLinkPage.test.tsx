import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
const adapter = vi.hoisted(() => ({ getGuestLinkByToken: vi.fn(), claimGuestLink: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: adapter }));

import ClaimLinkPage from '../ClaimLinkPage';

const guest = { id: 'l1', shortCode: 'abc1234', originalUrl: 'https://example.com/x', clicks: 12 };
const renderAt = (path: string, el: React.ReactNode, route: string) =>
    render(<MemoryRouter initialEntries={[path]}><Routes><Route path={route} element={el} /></Routes></MemoryRouter>);

beforeEach(() => { vi.clearAllMocks(); auth.user = null; localStorage.clear(); });

describe('ClaimLinkPage', () => {
    it('shows the real short address and asks a visitor to sign up', async () => {
        adapter.getGuestLinkByToken.mockResolvedValue(guest);
        renderAt('/claim/t1', <ClaimLinkPage />, '/claim/:token');
        expect(await screen.findByText(`${window.location.host}/abc1234`)).toBeTruthy();
        expect(screen.getByText('12 clicks so far')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Sign up free' })).toBeTruthy();
    });

    it('claims it for a signed-in user', async () => {
        auth.user = { id: 'u1' };
        adapter.getGuestLinkByToken.mockResolvedValue(guest);
        adapter.claimGuestLink.mockResolvedValue({ ...guest, isGuest: false });
        renderAt('/claim/t1', <ClaimLinkPage />, '/claim/:token');
        expect(await screen.findByText("It's yours")).toBeTruthy();
        expect(adapter.claimGuestLink).toHaveBeenCalledWith('t1', 'u1');
    });

    it('explains a missing link', async () => {
        adapter.getGuestLinkByToken.mockResolvedValue(null);
        renderAt('/claim/t1', <ClaimLinkPage />, '/claim/:token');
        expect(await screen.findByText(/already kept by an account, or it has expired/)).toBeTruthy();
    });
});
