import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const auth = vi.hoisted(() => ({
    user: { id: 'u1', email: 'me@example.com', displayName: 'Asha', amazonAssociateTag: 'old-21', flipkartAffiliateId: '', preferences: { subscription_tier: 'free' } } as any,
    signOut: vi.fn(), updateProfile: vi.fn(), updatePassword: vi.fn(),
}));
const adapter = vi.hoisted(() => ({ propagateAffiliateTags: vi.fn(), uploadAvatar: vi.fn() }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: adapter }));
vi.mock('../../components/DomainManager', () => ({ default: () => <div>domains</div> }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() } }));

import Settings, { planSummary } from '../Settings';

beforeEach(() => {
    vi.clearAllMocks();
    auth.updateProfile.mockResolvedValue({ success: true });
    auth.updatePassword.mockResolvedValue({ success: true });
    auth.signOut.mockResolvedValue(undefined);
    adapter.propagateAffiliateTags.mockResolvedValue(undefined);
});

describe('Settings', () => {
    it('saves a changed name only', async () => {
        render(<Settings />);
        const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
        expect(save.disabled).toBe(true);
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Asha K ' } });
        fireEvent.click(save);
        await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith({ displayName: 'Asha K' }));
    });

    it('checks the new password before sending it', async () => {
        render(<Settings />);
        fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(auth.updatePassword).not.toHaveBeenCalled();
    });

    it('saves affiliate tags and updates existing links', async () => {
        render(<Settings />);
        fireEvent.change(screen.getByLabelText('Amazon Associates tag'), { target: { value: ' new-21 ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save tags' }));
        await waitFor(() => expect(adapter.propagateAffiliateTags).toHaveBeenCalledWith('u1', 'new-21', ''));
        expect(auth.updateProfile).toHaveBeenCalledWith({ amazonAssociateTag: 'new-21', flipkartAffiliateId: '' });
    });

    it('signs out here, or everywhere after confirming', async () => {
        const confirm = vi.spyOn(window, 'confirm');
        render(<Settings />);
        confirm.mockReturnValueOnce(false);
        fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
        expect(auth.signOut).not.toHaveBeenCalled();
        confirm.mockReturnValueOnce(true);
        fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
        await waitFor(() => expect(auth.signOut).toHaveBeenCalledWith(true));
        expect(navigate).toHaveBeenCalledWith('/');
    });

    it('sends free accounts to the plans page', () => {
        render(<Settings />);
        fireEvent.click(screen.getByRole('button', { name: /See plans/ }));
        expect(navigate).toHaveBeenCalledWith('/pricing');
    });
});

describe('planSummary', () => {
    it('describes free and paid plans', () => {
        expect(planSummary(undefined, undefined)).toMatchObject({ name: 'Free', upgrade: true, note: null });
        expect(planSummary('pro', 'active')).toMatchObject({ name: 'Pro', upgrade: false, note: null });
        expect(planSummary('business', 'past_due').note).toMatch(/payment failed/);
    });
});
