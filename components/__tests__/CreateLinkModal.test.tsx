import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('../../services/storage/supabaseAdapter', () => ({ supabaseAdapter: { getFolders: vi.fn().mockResolvedValue([]), getDomains: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../services/geminiService', () => ({ analyzeUrlWithGemini: vi.fn(), generateLinkMetadata: vi.fn() }));
vi.mock('../../services/googleDriveService', () => ({ extractDriveFolderId: vi.fn(), fetchDriveFolderImages: vi.fn() }));
vi.mock('../TagInput', () => ({ TagInput: () => null }));
vi.mock('../UTMBuilderModal', () => ({ default: () => null }));
vi.mock('qrcode.react', () => ({ QRCodeCanvas: () => null }));

import CreateLinkModal, { MAX_BULK_LINKS, shortLinkLabel } from '../CreateLinkModal';

const props = () => ({
    isOpen: true, onClose: vi.fn(), onUpdate: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined), onBulkCreate: vi.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe('CreateLinkModal', () => {
    it('creates a link without a typed short code, picking a random one', async () => {
        const p = props();
        render(<CreateLinkModal {...p} />);
        fireEvent.change(screen.getByPlaceholderText('https://example.com/my-long-url'), { target: { value: 'https://example.com/a' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create link' }));
        await waitFor(() => expect(p.onCreate).toHaveBeenCalled());
        expect(p.onCreate.mock.calls[0][0].shortCode).toMatch(/^[a-z2-9]{7}$/);
        expect(await screen.findByText('Link ready')).toBeTruthy();
    });

    it('keeps a typed short code', async () => {
        const p = props();
        render(<CreateLinkModal {...p} />);
        fireEvent.change(screen.getByPlaceholderText('https://example.com/my-long-url'), { target: { value: 'https://example.com/a' } });
        fireEvent.change(screen.getByLabelText(/Short code/), { target: { value: 'sale' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create link' }));
        await waitFor(() => expect(p.onCreate.mock.calls[0][0].shortCode).toBe('sale'));
    });

    it('refuses more than the bulk limit', async () => {
        const p = props();
        render(<CreateLinkModal {...p} />);
        fireEvent.click(screen.getByRole('button', { name: 'Many links' }));
        const urls = Array.from({ length: MAX_BULK_LINKS + 1 }, (_, i) => `https://example.com/${i}`).join('\n');
        fireEvent.change(screen.getByLabelText('Addresses, one per line'), { target: { value: urls } });
        fireEvent.click(screen.getByRole('button', { name: 'Create links' }));
        expect((await screen.findByRole('alert')).textContent).toMatch(`up to ${MAX_BULK_LINKS}`);
        expect(p.onBulkCreate).not.toHaveBeenCalled();
    });

    it('gives bulk links random codes', async () => {
        const p = props();
        render(<CreateLinkModal {...p} />);
        fireEvent.click(screen.getByRole('button', { name: 'Many links' }));
        fireEvent.change(screen.getByLabelText('Addresses, one per line'), { target: { value: 'example.com/a\nexample.com/b' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create links' }));
        await waitFor(() => expect(p.onBulkCreate).toHaveBeenCalled());
        const links = p.onBulkCreate.mock.calls[0][0];
        expect(links).toHaveLength(2);
        links.forEach((l: { shortCode: string }) => expect(l.shortCode).toMatch(/^[a-z2-9]{7}$/));
    });

    it('offers a sample CSV that exists', () => {
        render(<CreateLinkModal {...props()} />);
        fireEvent.click(screen.getByRole('button', { name: 'CSV file' }));
        const a = screen.getByRole('link', { name: 'Download a sample' }) as HTMLAnchorElement;
        expect(a.getAttribute('href')).toMatch(/^data:text\/csv/);
        expect(decodeURIComponent(a.getAttribute('href')!.split(',').slice(1).join(','))).toMatch(/^url,slug,title,tags/);
    });
});

describe('shortLinkLabel', () => {
    it('shows the address people share', () => {
        expect(shortLinkLabel({ shortCode: 'abc', domain: undefined }, 'https://links.trak.in')).toBe('links.trak.in/r/abc');
        expect(shortLinkLabel({ shortCode: 'abc', domain: 'go.me.in' }, 'https://links.trak.in')).toBe('go.me.in/abc');
    });
});
