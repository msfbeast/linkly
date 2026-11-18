import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn());
const createGuestLink = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (orig) => ({ ...(await orig() as object), useNavigate: () => navigate }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: { createGuestLink } }));
vi.mock('../../components/QRCodeGenerator', () => ({ default: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

beforeEach(() => vi.clearAllMocks());

describe('LandingPage', () => {
    it('shortens a link as a guest and says it lasts 7 days', async () => {
        createGuestLink.mockResolvedValue({ id: 'l1', shortCode: 'abc1234', originalUrl: 'https://example.com/x', claimToken: 't1' });
        render(<MemoryRouter><LandingPage /></MemoryRouter>);
        fireEvent.change(screen.getByPlaceholderText('Paste a long link'), { target: { value: 'example.com/x' } });
        fireEvent.click(screen.getByRole('button', { name: 'Shorten' }));
        expect(await screen.findByText(/abc1234/)).toBeTruthy();
        expect(createGuestLink).toHaveBeenCalledWith('https://example.com/x', expect.any(String));
        expect(screen.getByText(/Works for 7 days/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Keep this link/ }));
        expect(navigate).toHaveBeenCalledWith('/claim/t1');
    });

    it('shows a failed shorten', async () => {
        createGuestLink.mockRejectedValue(new Error('Too many links from this network'));
        render(<MemoryRouter><LandingPage /></MemoryRouter>);
        fireEvent.change(screen.getByPlaceholderText('Paste a long link'), { target: { value: 'https://example.com' } });
        fireEvent.click(screen.getByRole('button', { name: 'Shorten' }));
        expect((await screen.findByRole('alert')).textContent).toMatch('Too many links');
    });

    it('takes a claimed username to sign-up', () => {
        render(<MemoryRouter><LandingPage /></MemoryRouter>);
        fireEvent.click(screen.getByRole('button', { name: 'Claim your page' }));
        fireEvent.change(screen.getByPlaceholderText('yourname'), { target: { value: '@asha' } });
        fireEvent.click(screen.getByRole('button', { name: /^Claim$/ }));
        expect(navigate).toHaveBeenCalledWith('/register', { state: { username: 'asha' } });
    });
});
