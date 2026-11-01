import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LinkAnalytics as LinkAnalyticsData, ClickEvent, LinkData } from '../../types';

const { getLink, getLinkStats, getLinkAnalytics, getLinkClicksPage, getAllLinkClicks } = vi.hoisted(() => ({
    getLink: vi.fn(),
    getLinkStats: vi.fn(),
    getLinkAnalytics: vi.fn(),
    getLinkClicksPage: vi.fn(),
    getAllLinkClicks: vi.fn(),
}));

vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: { getLink } }));
vi.mock('../../services/aggregatedAnalyticsService', () => ({
    aggregatedAnalytics: { getLinkStats, getLinkAnalytics, getLinkClicksPage, getAllLinkClicks },
}));
// The map draws SVG geography from a remote topology; not what this test is about.
vi.mock('../../components/LiveWorldMap', () => ({
    default: (props: { countryCounts?: { name: string; value: number }[] }) => (
        <div data-testid="map">{(props.countryCounts || []).map(c => `${c.name}:${c.value}`).join(',')}</div>
    ),
}));

import LinkAnalytics from '../LinkAnalytics';

const link = {
    id: 'link-1', title: 'Big link', originalUrl: 'https://example.com', shortCode: 'big',
    clicks: 0, createdAt: 0, tags: [], clickHistory: [],
} as unknown as LinkData;

const analytics = (range: LinkAnalyticsData['range'], total: number): LinkAnalyticsData => ({
    range, timezone: 'UTC', total, unique: 40, previousTotal: total / 2, previousUnique: 40,
    timeline: [], devices: [{ name: 'mobile', value: total }], browsers: [{ name: 'Chrome', value: total }],
    oses: [{ name: 'android', value: total }], countries: [{ name: 'India', value: total }],
    referrers: [{ name: 'direct', value: total }], deviceModels: [], screenWidths: [], languages: [],
    timezones: [], regions: [], cities: [], heatmap: [{ day: 1, hour: 9, count: total }], destinations: [],
});

const click = (n: number): ClickEvent => ({
    timestamp: Date.now() - n * 60000, referrer: 'direct', device: 'mobile', os: 'android',
    browser: 'Chrome', country: `Country-${n}`,
});

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/analytics/link-1']}>
            <Routes><Route path="/analytics/:id" element={<LinkAnalytics />} /></Routes>
        </MemoryRouter>,
    );
}

beforeAll(() => {
    // recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
    vi.clearAllMocks();
    getLink.mockResolvedValue(link);
    getLinkStats.mockResolvedValue(null);
    getLinkAnalytics.mockImplementation(async (_id: string, range: LinkAnalyticsData['range']) =>
        analytics(range, range === 'all' ? 106935 : 1925));
    getLinkClicksPage.mockImplementation(async (_id: string, _since: number | null, offset: number) =>
        Array.from({ length: 10 }, (_, i) => click(offset + i)));
});

describe('link analytics page', () => {
    it('shows server counts for the range and pages the click table', async () => {
        renderPage();

        await screen.findByText('Showing 1 - 10 of 1,925');
        expect(getLinkAnalytics).toHaveBeenCalledWith('link-1', '7d', expect.any(String));
        // The table asks for one page, from the start of the 7 day window.
        const [, since, offset, limit] = getLinkClicksPage.mock.calls[0];
        expect(Date.now() - since).toBeGreaterThan(7 * 864e5 - 60000);
        expect([offset, limit]).toEqual([0, 10]);
        expect(screen.getByText('Country-0')).toBeTruthy();
        expect(screen.getByTestId('map').textContent).toBe('India:1925');
        expect(screen.getAllByText('1925 clicks').length).toBeGreaterThan(0); // heatmap cell tooltip
    });

    it('switches range and goes back to the first page', async () => {
        renderPage();
        await screen.findByText('Showing 1 - 10 of 1,925');

        fireEvent.click(screen.getByRole('button', { name: 'All Time' }));

        await screen.findByText('Showing 1 - 10 of 106,935');
        expect(getLinkAnalytics).toHaveBeenLastCalledWith('link-1', 'all', expect.any(String));
        const [, since, offset] = getLinkClicksPage.mock.calls.at(-1)!;
        expect([since, offset]).toEqual([null, 0]);
    });

    it('says when analytics fail and retries', async () => {
        getLinkAnalytics.mockRejectedValueOnce(new Error('timeout'));
        renderPage();

        await screen.findByText("Couldn't load analytics for this range.");
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        await screen.findByText('Showing 1 - 10 of 1,925');
        expect(getLinkAnalytics).toHaveBeenCalledTimes(2);
    });
});
