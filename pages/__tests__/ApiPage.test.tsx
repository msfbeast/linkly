import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const adapter = vi.hoisted(() => ({ getApiKeys: vi.fn(), createApiKey: vi.fn(), revokeApiKey: vi.fn() }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: adapter }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

import ApiPage, { canCreateLinks } from '../ApiPage';

const oldKey = { id: 'k1', userId: 'u1', name: 'Key 1', prefix: 'ga_live_ab12...', scopes: ['links:read'], createdAt: Date.parse('2026-06-19') };

beforeEach(() => {
    vi.clearAllMocks();
    adapter.getApiKeys.mockResolvedValue([oldKey]);
});

describe('ApiPage', () => {
    it('creates keys that can create links, named by the user', async () => {
        adapter.createApiKey.mockResolvedValue({ apiKey: { ...oldKey, id: 'k2', name: 'Zapier', scopes: ['links:write'] }, secretKey: 'ga_live_secret' });
        render(<ApiPage />);
        await screen.findByText('Key 1');
        fireEvent.change(screen.getByLabelText('Key name'), { target: { value: 'Zapier' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create key' }));
        await waitFor(() => expect(adapter.createApiKey).toHaveBeenCalledWith('Zapier', ['links:write']));
        expect(await screen.findByText('ga_live_secret')).toBeTruthy();
    });

    it('marks old read-only keys', async () => {
        render(<ApiPage />);
        expect(await screen.findByText("can't create links")).toBeTruthy();
    });
});

describe('canCreateLinks', () => {
    it('needs links:write', () => {
        expect(canCreateLinks(oldKey)).toBe(false);
        expect(canCreateLinks({ ...oldKey, scopes: ['links:write'] })).toBe(true);
    });
});
