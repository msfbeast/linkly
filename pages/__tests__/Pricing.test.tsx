import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const auth = vi.hoisted(() => ({ user: null as any }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), loading: vi.fn(), dismiss: vi.fn() } }));

import Pricing from '../Pricing';

beforeEach(() => { vi.clearAllMocks(); auth.user = null; });

describe('Pricing', () => {
    it('lists what each plan really includes', () => {
        render(<Pricing />);
        expect(screen.getByText('50 short links')).toBeTruthy();
        expect(screen.getByText('Unlimited short links')).toBeTruthy();
        expect(screen.getByText('90 days of analytics history')).toBeTruthy();
        expect(screen.queryByText(/Team|Digital Storefront|15 Active Links/)).toBeNull();
        expect(screen.getByText('₹399')).toBeTruthy();
    });

    it('switches to yearly prices', () => {
        render(<Pricing />);
        fireEvent.click(screen.getByRole('button', { name: /Yearly/ }));
        expect(screen.getByText('₹3,999')).toBeTruthy();
    });

    it('sends visitors to sign up and marks a signed-in user\'s plan', () => {
        render(<Pricing />);
        fireEvent.click(screen.getByRole('button', { name: 'Get Pro' }));
        expect(navigate).toHaveBeenCalledWith('/register');
    });

    it('marks the current plan', () => {
        auth.user = { id: 'u1', preferences: { subscription_tier: 'pro' } };
        render(<Pricing />);
        expect((screen.getByRole('button', { name: 'Your plan' }) as HTMLButtonElement).disabled).toBe(true);
    });
});

describe('Pricing, signed out', () => {
    it('marks no plan as yours', () => {
        auth.user = null;
        render(<Pricing />);
        expect(screen.queryByText('your plan')).toBeNull();
        expect(screen.getByRole('button', { name: 'Sign up free' })).toBeTruthy();
    });
});
