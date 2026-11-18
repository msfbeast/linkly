import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../../services/storage/supabaseClient', () => ({ supabase: { rpc }, isSupabaseConfigured: () => true }));

import SharedAnalytics, { weekOverWeek } from '../SharedAnalytics';

const renderAt = () => render(<MemoryRouter initialEntries={['/share/tok']}><Routes><Route path="/share/:shareToken" element={<SharedAnalytics />} /></Routes></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('SharedAnalytics', () => {
    it('shows the shared numbers', async () => {
        rpc.mockResolvedValue({ data: {
            displayName: 'Gadget Picks',
            stats: { totalClicks: 785241, clicksThisWeek: 12882, clicksLastWeek: 15270, clicksThisMonth: 52000 },
            countries: [{ country: 'India', clickCount: 700000 }], cities: [{ city: 'Pune', country: 'India', clickCount: 5000 }],
            devices: [{ device: 'Mobile', clickCount: 80 }], browsers: [{ browser: 'Chrome', clickCount: 60 }],
        }, error: null });
        renderAt();
        expect(await screen.findByText('Gadget Picks')).toBeTruthy();
        expect(screen.getByText('12,882')).toBeTruthy();
        expect(screen.getByText('↘ 16%')).toBeTruthy();
        expect(screen.getByText('7,85,241')).toBeTruthy();
        expect(rpc).toHaveBeenCalledWith('get_shared_analytics', { p_share_token: 'tok' });
    });

    it('says an expired link has expired', async () => {
        rpc.mockResolvedValue({ data: null, error: null });
        renderAt();
        expect(await screen.findByText('This share link has expired')).toBeTruthy();
    });

    it('tells a failure apart from an expired link', async () => {
        rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
        renderAt();
        expect(await screen.findByText("Couldn't load these numbers")).toBeTruthy();
    });

    it('weekOverWeek needs a previous week', () => {
        expect(weekOverWeek(5, 0)).toBeNull();
        expect(weekOverWeek(150, 100)).toBe(50);
    });
});
