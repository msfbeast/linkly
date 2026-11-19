import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const api = vi.hoisted(() => ({
    getUserClickStats: vi.fn(), getClicksOverTime: vi.fn(), getUserAnalyticsExtras: vi.fn(),
    getCountryBreakdown: vi.fn(), getCityBreakdown: vi.fn(), getDeviceBreakdown: vi.fn(), getOsBreakdown: vi.fn(),
    getBrowserBreakdown: vi.fn(), getDeviceModelBreakdown: vi.fn(), getReferrerBreakdown: vi.fn(), getUserBreakdowns: vi.fn(),
}));
const getLinks = vi.hoisted(() => vi.fn());
vi.mock('../../services/aggregatedAnalyticsService', () => ({ aggregatedAnalytics: api }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: { getLinks } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1', preferences: { subscription_tier: 'free' } } }) }));
vi.mock('../../components/LiveWorldMap', () => ({ default: ({ title }: { title: string }) => <div>{title}</div> }));

import GlobalAnalytics, { dailyPoints, weekChange } from '../GlobalAnalytics';

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
    vi.clearAllMocks();
    api.getUserClickStats.mockResolvedValue({ totalClicks: 785241, uniqueVisitors: 1200, clicksThisWeek: 12882 });
    api.getClicksOverTime.mockResolvedValue([{ date: today, clickCount: 40 }]);
    api.getUserAnalyticsExtras.mockResolvedValue({
        thisWeek: 12882, lastWeek: 15270, heatmap: [{ day: 4, hour: 20, clicks: 851 }],
        recent: [{ timestamp: '2026-11-17T10:00:00Z', country: 'India', city: 'Pune', device: 'Mobile', os: 'Android', browser: 'Chrome', referrer: 'https://www.youtube.com/' }],
        countries: [], regions: [],
    });
    api.getCountryBreakdown.mockResolvedValue([{ country: 'India', clickCount: 719351 }]);
    api.getCityBreakdown.mockResolvedValue([{ city: 'Pune', country: 'India', clickCount: 5000 }]);
    api.getDeviceBreakdown.mockResolvedValue([{ device: 'Mobile', clickCount: 70 }, { device: 'Desktop', clickCount: 30 }]);
    api.getOsBreakdown.mockResolvedValue([{ os: 'Android', clickCount: 60 }]);
    api.getBrowserBreakdown.mockResolvedValue([{ browser: 'Chrome', clickCount: 50 }]);
    api.getDeviceModelBreakdown.mockResolvedValue([{ deviceModel: 'Android (Other)', clickCount: 66 }]);
    api.getReferrerBreakdown.mockResolvedValue([{ referrer: 'YouTube', clickCount: 90 }, { referrer: 'Direct', clickCount: 10 }]);
    getLinks.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    api.getUserBreakdowns.mockResolvedValue(null);
});

describe('GlobalAnalytics', () => {
    it('shows the range, the week and all-time numbers', async () => {
        render(<GlobalAnalytics />);
        expect(await screen.findByText('Clicks · last 7 days')).toBeTruthy();
        expect(screen.getByText('40')).toBeTruthy(); // clicks in the range
        expect(screen.getByText('12,882')).toBeTruthy();
        expect(screen.getByText('↘ 16%')).toBeTruthy();
        expect(screen.getByText('7,85,241')).toBeTruthy();
        expect(screen.getByText('3,92,621 clicks per link')).toBeTruthy();
        expect(screen.getByText(/Busiest hour: Thu 8pm to 9pm/)).toBeTruthy();
        expect(screen.getByText('Pune, India')).toBeTruthy(); // latest click
        expect(screen.getAllByText('YouTube').length).toBe(2); // latest click's source and the sources list
        expect(api.getUserAnalyticsExtras).toHaveBeenCalledWith(7, expect.any(String));
    });

    it('reloads for 30 days and keeps 90 days for Pro', async () => {
        render(<GlobalAnalytics />);
        await screen.findByText('Clicks · last 7 days');
        expect((screen.getByRole('button', { name: /90 days/ }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: '30 days' }));
        expect(await screen.findByText('Clicks · last 30 days')).toBeTruthy();
        expect(api.getClicksOverTime).toHaveBeenLastCalledWith('u1', 30);
    });

    it('labels breakdowns all time when range breakdowns aren\'t available', async () => {
        render(<GlobalAnalytics />);
        await screen.findByText('Clicks · last 7 days');
        expect(screen.getAllByText('all time').length).toBeGreaterThanOrEqual(4);
        expect(screen.queryByText('last 7 days')).toBeNull();
    });

    it('shows breakdowns for the selected range when available', async () => {
        api.getUserBreakdowns.mockResolvedValue({
            countries: [{ country: 'US', clickCount: 30 }], cities: [], devices: [{ device: 'Desktop', clickCount: 40 }],
            oses: [], browsers: [{ browser: 'Safari', clickCount: 40 }], models: [], referrers: [{ referrer: 'Instagram', clickCount: 40 }],
        });
        render(<GlobalAnalytics />);
        await screen.findByText('Clicks · last 7 days');
        expect(api.getUserBreakdowns).toHaveBeenCalledWith(7);
        expect(screen.getAllByText('last 7 days').length).toBe(4);
        expect(screen.getByText('Safari')).toBeTruthy();
        expect(screen.queryByText('Chrome')).toBeNull(); // the all-time browser isn't shown
    });

    it('says when it can\'t load and retries', async () => {
        api.getUserClickStats.mockResolvedValueOnce(null);
        api.getUserAnalyticsExtras.mockResolvedValueOnce(null);
        render(<GlobalAnalytics />);
        fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Clicks · last 7 days')).toBeTruthy();
    });
});

describe('helpers', () => {
    it('weekChange compares with last week, or null without one', () => {
        expect(weekChange(12882, 15270)).toBe(-16);
        expect(weekChange(5, 0)).toBeNull();
    });

    it('dailyPoints fills every day, today last', () => {
        const now = new Date('2026-11-17T12:00:00Z');
        const pts = dailyPoints([{ date: '2026-11-15', clickCount: 3 }], 7, now);
        expect(pts).toHaveLength(7);
        expect(pts[6].key).toBe('2026-11-17');
        expect(pts[4]).toMatchObject({ key: '2026-11-15', value: 3 });
        expect(pts[0].value).toBe(0);
        expect(dailyPoints([], 30, now)[29].label).toBe('17');
    });
});
