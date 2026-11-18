import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const adapter = vi.hoisted(() => ({
    getBioProfiles: vi.fn(), getLinks: vi.fn(), updateBioProfile: vi.fn(), checkHandleAvailability: vi.fn(),
    createBioProfile: vi.fn(), uploadAvatar: vi.fn(),
}));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: adapter }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1', displayName: 'Asha' } }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import BioDashboard, { cleanHandle, draftChanges } from '../BioDashboard';

const profile = { id: 'b1', userId: 'u1', handle: 'asha', displayName: 'Asha', bio: 'Hi', avatarUrl: '', theme: 'cyberpunk', links: ['l2', 'l1'], views: 42, isPublished: true };
const links = [
    { id: 'l1', shortCode: 'one', title: 'First', originalUrl: 'https://a', clicks: 0, createdAt: 0, tags: [] },
    { id: 'l2', shortCode: 'two', title: 'Second', originalUrl: 'https://b', clicks: 0, createdAt: 0, tags: [] },
    { id: 'l3', shortCode: 'three', title: 'Third', originalUrl: 'https://c', clicks: 0, createdAt: 0, tags: [] },
];

beforeEach(() => {
    vi.clearAllMocks();
    adapter.getBioProfiles.mockResolvedValue([profile]);
    adapter.getLinks.mockResolvedValue(links);
    adapter.updateBioProfile.mockImplementation(async (_id, changes) => ({ ...profile, ...changes }));
});

describe('BioDashboard', () => {
    it('shows the page as visitors see it: legacy dark theme becomes the dark look, links in order', async () => {
        render(<BioDashboard />);
        expect(await screen.findByText('42 views · products come from the Products tab')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'dark' }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true');
        const preview = screen.getByLabelText('Preview');
        expect(preview.textContent!.indexOf('Second')).toBeLessThan(preview.textContent!.indexOf('First'));
    });

    it('saves only what changed', async () => {
        render(<BioDashboard />);
        await screen.findByLabelText(/^Bio/);
        fireEvent.change(screen.getByLabelText(/^Bio/), { target: { value: 'New bio ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add links' }));
        fireEvent.click(screen.getByRole('button', { name: /Third/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(adapter.updateBioProfile).toHaveBeenCalledWith('b1', { bio: 'New bio', links: ['l2', 'l1', 'l3'] }));
        await waitFor(() => expect(screen.queryByText('Unsaved changes')).toBeNull());
    });

    it('won\'t save a taken handle', async () => {
        adapter.checkHandleAvailability.mockResolvedValue(false);
        render(<BioDashboard />);
        fireEvent.change(await screen.findByLabelText('Handle'), { target: { value: 'Taken' } });
        expect(await screen.findByText('That handle is taken.')).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('asks for an address when there is no page yet', async () => {
        adapter.getBioProfiles.mockResolvedValue([]);
        adapter.checkHandleAvailability.mockResolvedValue(true);
        adapter.createBioProfile.mockResolvedValue({ ...profile, handle: 'newone', links: [] });
        render(<BioDashboard />);
        fireEvent.change(await screen.findByLabelText('Handle'), { target: { value: 'NewOne' } });
        await screen.findByText('Available.');
        fireEvent.click(screen.getByRole('button', { name: /Create my page/ }));
        await waitFor(() => expect(adapter.createBioProfile).toHaveBeenCalledWith('u1', 'newone', 'Asha'));
    });
});

describe('helpers', () => {
    it('cleanHandle keeps handles URL-safe', () => {
        expect(cleanHandle('@My Shop!')).toBe('myshop');
    });
    it('draftChanges is empty when nothing changed', () => {
        const d = { displayName: 'A', handle: 'a', bio: '', avatarUrl: '', look: 'light' as const, links: ['x'] };
        expect(draftChanges(d, { ...d })).toEqual({});
        expect(draftChanges(d, { ...d, look: 'dark' })).toEqual({ theme: 'dark' });
    });
});
