import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const api = vi.hoisted(() => ({
    getUserClickStats: vi.fn(), getClicksOverTime: vi.fn(), getUserAnalyticsExtras: vi.fn(),
    getDeviceBreakdown: vi.fn(), getReferrerBreakdown: vi.fn(), getCountryBreakdown: vi.fn(),
    getDeviceModelBreakdown: vi.fn(), getTopLinks: vi.fn(),
}));
vi.mock('../../../services/aggregatedAnalyticsService', () => ({ aggregatedAnalytics: api }));

import OverviewBento from '../OverviewBento';

beforeEach(() => {
    vi.clearAllMocks();
    api.getUserClickStats.mockResolvedValue({ totalClicks: 785241 });
    api.getClicksOverTime.mockResolvedValue([]);
    api.getUserAnalyticsExtras.mockResolvedValue({ thisWeek: 12882, lastWeek: 15270, heatmap: [{ day: 4, hour: 20, clicks: 851 }], recent: [], countries: [], regions: [] });
    api.getDeviceBreakdown.mockResolvedValue([{ device: 'Mobile', clickCount: 70 }, { device: 'Desktop', clickCount: 30 }]);
    api.getReferrerBreakdown.mockResolvedValue([{ referrer: 'YouTube', clickCount: 90 }, { referrer: 'Direct', clickCount: 10 }]);
    api.getCountryBreakdown.mockResolvedValue([{ country: 'India', clickCount: 719351 }]);
    api.getDeviceModelBreakdown.mockResolvedValue([{ deviceModel: 'Android (Other)', clickCount: 66 }]);
    api.getTopLinks.mockResolvedValue([{ id: 'l1', title: 'New Link', shortCode: 'sjwrue', clicks: 1339, spark: [1, 2, 3] }]);
});

describe('OverviewBento', () => {
    it('shows the account\'s numbers', async () => {
        render(<OverviewBento userId="u1" dateRange="30d" linkCount={251} />);
        expect(await screen.findByText('12,882')).toBeTruthy();
        expect(screen.getByText('/ 15,270 last week')).toBeTruthy();
        expect(screen.getByText('↘ 16%')).toBeTruthy();
        expect(screen.getByText('7,85,241')).toBeTruthy();
        expect(screen.getByText('90%')).toBeTruthy();
        expect(screen.getByText(/Busiest hour: Thu 8pm to 9pm/)).toBeTruthy();
        expect(screen.getByText('/sjwrue')).toBeTruthy(); // untitled link shows its code
        expect(api.getUserAnalyticsExtras).toHaveBeenCalledWith(30, expect.any(String));
        expect(api.getTopLinks).toHaveBeenCalledWith(30);
    });

    it('says when it can\'t load and retries', async () => {
        api.getUserClickStats.mockResolvedValueOnce(null);
        api.getUserAnalyticsExtras.mockResolvedValueOnce(null);
        render(<OverviewBento userId="u1" dateRange="7d" linkCount={3} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('12,882')).toBeTruthy();
    });
});
