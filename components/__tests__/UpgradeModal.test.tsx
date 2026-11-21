import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpgradeModal } from '../UpgradeModal';

describe('UpgradeModal', () => {
    it('lists only what Pro adds', () => {
        render(<MemoryRouter><UpgradeModal isOpen onClose={() => {}} /></MemoryRouter>);
        expect(screen.getByRole('dialog', { name: "You've used all your free links" })).toBeInTheDocument();
        expect(screen.getByText('Unlimited links')).toBeInTheDocument();
        expect(screen.getByText('90 days of analytics')).toBeInTheDocument();
        expect(screen.queryByText(/custom domain/i)).toBeNull();
    });

    it('closes on Escape and renders nothing when closed', () => {
        const onClose = vi.fn();
        const { rerender } = render(<MemoryRouter><UpgradeModal isOpen onClose={onClose} /></MemoryRouter>);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
        rerender(<MemoryRouter><UpgradeModal isOpen={false} onClose={onClose} /></MemoryRouter>);
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});
