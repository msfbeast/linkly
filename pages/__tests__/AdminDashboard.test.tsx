import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../services/storage/supabaseClient', () => ({ supabase: { rpc } }));
vi.mock('../../components/admin/LinkReports', () => ({ default: () => null }));
vi.mock('../../components/admin/RecentErrors', () => ({ default: () => null }));

import AdminDashboard from '../AdminDashboard';

const overview = {
    stats: { users: 387, usersLast30d: 51, activeLast30d: 120, links: 815, linksLast30d: 90, guestLinks: 188, clicksLast7d: 12882, plans: { free: 381, pro: 4, business: 2 } },
    users: [{ id: 'u1', email: 'asha@example.com', name: 'Asha', username: 'asha', plan: 'pro', role: 'admin', joined: '2026-10-01T00:00:00Z', lastSignIn: null, links: 12, clicks: 3400 }],
};

beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: overview, error: null }); });

describe('AdminDashboard', () => {
    it('shows platform numbers, plans and users from admin_overview', async () => {
        render(<AdminDashboard />);
        expect(await screen.findByText('387')).toBeTruthy();
        expect(screen.getByText('+51 in 30 days')).toBeTruthy();
        expect(screen.getByText('31% of users')).toBeTruthy();
        expect(screen.getByText('Asha')).toBeTruthy();
        expect(screen.getByText('asha@example.com · @asha')).toBeTruthy();
        expect(screen.getByText('3,400')).toBeTruthy();
        expect(rpc).toHaveBeenCalledWith('admin_overview', { p_search: null, p_limit: 200 });
    });

    it('searches on the server', async () => {
        render(<AdminDashboard />);
        await screen.findByText('Asha');
        fireEvent.change(screen.getByLabelText('Search users'), { target: { value: ' asha ' } });
        await waitFor(() => expect(rpc).toHaveBeenLastCalledWith('admin_overview', { p_search: 'asha', p_limit: 200 }));
    });

    it('says when it fails', async () => {
        rpc.mockResolvedValue({ data: null, error: { message: 'Not allowed' } });
        render(<AdminDashboard />);
        expect(await screen.findByText("Couldn't load the platform numbers.")).toBeTruthy();
    });
});
