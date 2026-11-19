import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const signOut = vi.fn().mockResolvedValue(undefined);
const navigate = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1', email: 'asha@example.com' }, signOut }) }));
vi.mock('../../../services/storage/supabaseClient', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } } }));
vi.mock('react-router-dom', async (orig) => ({ ...(await orig<typeof import('react-router-dom')>()), useNavigate: () => navigate }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import DeleteAccount from '../DeleteAccount';

const renderIt = (isPaid = false) => render(<MemoryRouter><DeleteAccount isPaid={isPaid} supportEmail="support@gather.link" /></MemoryRouter>);

describe('DeleteAccount', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); signOut.mockClear(); navigate.mockClear(); });

    it('points paid plans to support instead', () => {
        renderIt(true);
        expect(screen.getByText(/You're on a paid plan/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Delete account/ })).toBeNull();
    });

    it('only deletes after the email is typed, then signs out', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
        renderIt();
        fireEvent.click(screen.getByRole('button', { name: /Delete account/ }));
        const submit = screen.getByRole('button', { name: /Delete my account/ });
        expect(submit).toBeDisabled();
        fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: 'Asha@Example.com' } });
        expect(submit).toBeEnabled();
        fireEvent.click(submit);
        await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
        expect(fetch).toHaveBeenCalledWith('/api/account/delete', expect.objectContaining({
            method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer tok' }), body: JSON.stringify({ confirmEmail: 'Asha@Example.com' }),
        }));
        expect(signOut).toHaveBeenCalled();
    });

    it('shows the server\'s error and stays signed in', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, json: async () => ({ error: 'paid_plan' }) });
        renderIt();
        fireEvent.click(screen.getByRole('button', { name: /Delete account/ }));
        fireEvent.change(screen.getByLabelText(/to confirm/), { target: { value: 'asha@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /Delete my account/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Cancel your plan first');
        expect(signOut).not.toHaveBeenCalled();
    });
});
