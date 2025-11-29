import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LinkCard from './LinkCard';
import { LinkData } from '../types';

// Mock dependencies
vi.mock('@dnd-kit/core', () => ({
    useDraggable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        isDragging: false,
    }),
}));

vi.mock('@dnd-kit/utilities', () => ({
    CSS: {
        Translate: {
            toString: () => '',
        },
    },
}));

const mockLink: LinkData = {
    id: '123',
    title: 'Test Link',
    originalUrl: 'https://example.com',
    shortCode: 'test',
    clicks: 0,
    createdAt: Date.now(),
    userId: 'user1',
    folderId: null,
    tags: [],
};

const renderLinkCard = (link: LinkData) => {
    return render(
        <BrowserRouter>
            <LinkCard
                link={link}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
            />
        </BrowserRouter>
    );
};

describe('LinkCard - Scheduling Badges', () => {
    beforeEach(() => {
        cleanup();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows "Scheduled" badge when startDate is in the future', () => {
        const futureDate = Date.now() + 100000;
        const link = { ...mockLink, startDate: futureDate };

        renderLinkCard(link);

        const badge = screen.getByText('Scheduled');
        expect(badge).toBeInTheDocument();
        expect(badge.closest('span')).toHaveClass('bg-yellow-100');
    });

    it('shows "Expired" badge when expirationDate is in the past', () => {
        const pastDate = Date.now() - 100000;
        const link = { ...mockLink, expirationDate: pastDate };

        renderLinkCard(link);

        const badge = screen.getByText('Expired');
        expect(badge).toBeInTheDocument();
        expect(badge.closest('span')).toHaveClass('bg-red-100');
    });

    it('shows "Active" badge when currently active (startDate past, expirationDate future)', () => {
        const pastDate = Date.now() - 100000;
        const futureDate = Date.now() + 100000;
        const link = { ...mockLink, startDate: pastDate, expirationDate: futureDate };

        renderLinkCard(link);

        const badge = screen.getByText('Active');
        expect(badge).toBeInTheDocument();
        expect(badge.closest('span')).toHaveClass('bg-emerald-100');
    });

    it('shows no badge when no dates are set', () => {
        renderLinkCard(mockLink);

        const scheduledBadge = screen.queryByText('Scheduled');
        const expiredBadge = screen.queryByText('Expired');
        const activeBadge = screen.queryByText('Active');

        expect(scheduledBadge).not.toBeInTheDocument();
        expect(expiredBadge).not.toBeInTheDocument();
        expect(activeBadge).not.toBeInTheDocument();
    });
});
