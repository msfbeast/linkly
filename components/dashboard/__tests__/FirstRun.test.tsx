import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const auth = { user: {} as Record<string, unknown>, updateProfile: vi.fn() };
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => auth }));

import FirstRun from '../FirstRun';
import DashboardHeader from '../DashboardHeader';

const renderIt = () => render(<MemoryRouter><FirstRun /></MemoryRouter>);

describe('FirstRun', () => {
    beforeEach(() => { auth.user = { id: 'u1' }; auth.updateProfile = vi.fn().mockResolvedValue({ success: true }); });

    it('asks for affiliate tags first, then the first link', () => {
        renderIt();
        expect(screen.getByText('Add your affiliate tags')).toBeInTheDocument();
        expect(screen.getByText('Shorten a link')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save tags/ })).toBeDisabled();
    });

    it('saves the tags it was given', async () => {
        renderIt();
        fireEvent.change(screen.getByLabelText('Amazon Associates tag'), { target: { value: ' me-21 ' } });
        fireEvent.click(screen.getByRole('button', { name: /Save tags/ }));
        await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith({ amazonAssociateTag: 'me-21', flipkartAffiliateId: '' }));
    });

    it('shows a save failure', async () => {
        auth.updateProfile = vi.fn().mockResolvedValue({ success: false, error: 'Nope' });
        renderIt();
        fireEvent.change(screen.getByLabelText('Flipkart affiliate ID'), { target: { value: 'fk1' } });
        fireEvent.click(screen.getByRole('button', { name: /Save tags/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Nope');
    });

    it('marks the tag step done when tags are set, and shows the tag in the example', () => {
        auth.user = { id: 'u1', amazonAssociateTag: 'me-21' };
        renderIt();
        expect(screen.getByLabelText('Done')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Save tags/ })).toBeNull();
        expect(screen.getByText('tag=me-21')).toBeInTheDocument();
    });
});

describe('DashboardHeader', () => {
    const props = { user: { displayName: 'Asha' }, dateRange: '30d' as never, setDateRange: () => {}, onExport: () => {}, isExporting: false };

    it('welcomes a new account and hides the range and export controls', () => {
        render(<DashboardHeader {...props} isNew />);
        expect(screen.getByRole('heading', { name: 'Welcome to Gather, Asha' })).toBeInTheDocument();
        expect(screen.queryByText('Export CSV')).toBeNull();
    });

    it('says welcome back once there are links', () => {
        render(<DashboardHeader {...props} />);
        expect(screen.getByRole('heading', { name: 'Welcome back, Asha' })).toBeInTheDocument();
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
});
