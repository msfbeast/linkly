import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const auth = vi.hoisted(() => ({ user: null, signUp: vi.fn(), checkUsernameAvailability: vi.fn(), signInWithOAuth: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: {} }));

import Register, { cleanUsername } from '../Register';

const fill = async () => {
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'Asha' } });
    await screen.findByLabelText('Available');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'longenough' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
};

beforeEach(() => {
    vi.clearAllMocks();
    auth.checkUsernameAvailability.mockResolvedValue(true);
});

describe('Register', () => {
    it('shows why sign-up failed instead of spinning', async () => {
        auth.signUp.mockResolvedValue({ success: false, error: 'An account with this email already exists' });
        render(<MemoryRouter><Register /></MemoryRouter>);
        await fill();
        expect((await screen.findByRole('alert')).textContent).toMatch('already exists');
        expect((screen.getByRole('button', { name: 'Create account' }) as HTMLButtonElement).disabled).toBe(false);
        expect(auth.signUp).toHaveBeenCalledWith('asha@example.com', 'longenough', 'asha');
    });

    it('asks to confirm the email when there is no session yet', async () => {
        auth.signUp.mockResolvedValue({ success: true, needsEmailConfirmation: true });
        render(<MemoryRouter><Register /></MemoryRouter>);
        await fill();
        expect(await screen.findByText('Check your email')).toBeTruthy();
    });

    it('checks the password before signing up', async () => {
        render(<MemoryRouter><Register /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'asha' } });
        await screen.findByLabelText('Available');
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'asha@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
        expect(await screen.findByText(/at least 8 characters/)).toBeTruthy();
        expect(auth.signUp).not.toHaveBeenCalled();
    });

    it('says when a username is taken', async () => {
        auth.checkUsernameAvailability.mockResolvedValue(false);
        render(<MemoryRouter><Register /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'taken' } });
        expect(await screen.findByText('That username is taken.')).toBeTruthy();
    });
});

describe('cleanUsername', () => {
    it('keeps usernames URL-safe', () => {
        expect(cleanUsername('@Asha K!')).toBe('ashak');
        expect(cleanUsername('a.b_c-d')).toBe('a.b_c-d');
    });
});
