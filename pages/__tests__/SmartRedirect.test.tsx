import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SmartRedirect from '../SmartRedirect';

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes><Route path="/open/:url" element={<SmartRedirect />} /></Routes>
        </MemoryRouter>,
    );
}

describe('/open/:url', () => {
    afterEach(() => vi.useRealTimers());

    it('refuses a javascript: URL instead of navigating to it', async () => {
        vi.useFakeTimers();
        const before = window.location.href;
        renderAt('/open/' + encodeURIComponent('javascript:alert(document.cookie)'));
        await act(async () => { vi.advanceTimersByTime(2000); });
        expect(screen.getByText('Invalid Link')).toBeTruthy();
        expect(window.location.href).toBe(before);
    });

    it('still offers web links', () => {
        renderAt('/open/' + encodeURIComponent('https://drive.google.com/file/d/1'));
        expect(screen.getByText('Open App').closest('a')?.getAttribute('href')).toBe('https://drive.google.com/file/d/1');
    });

    it('handles malformed encoding', () => {
        renderAt('/open/%E0%A4%A');
        expect(screen.getByText('Invalid Link')).toBeTruthy();
    });
});
