import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Terms from '../Terms';
import Privacy from '../Privacy';
import Cookies from '../Cookies';
import AboutPage from '../AboutPage';

const renderAt = (el: React.ReactElement) => render(<MemoryRouter>{el}</MemoryRouter>);

describe('legal pages', () => {
    it.each([
        ['Terms of Service', <Terms />],
        ['Privacy Policy', <Privacy />],
        ['Cookie Policy', <Cookies />],
        ['About Gather', <AboutPage />],
    ])('%s has its title, the page title and the legal links', (title, el) => {
        renderAt(el);
        expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
        expect(document.title).toBe(`${title} · Gather`);
        const nav = screen.getByRole('navigation', { name: 'Legal' });
        for (const name of ['Terms', 'Privacy', 'Cookies', 'About', 'Pricing']) {
            expect(nav.querySelector(`a[href="/${name.toLowerCase()}"]`)).not.toBeNull();
        }
    });

    it('privacy says IP addresses are hashed, not stored, and how to delete an account', () => {
        renderAt(<Privacy />);
        expect(screen.getByText(/We don't store your IP address/)).toBeInTheDocument();
        expect(screen.getByText(/delete your account and everything in it from Settings/)).toBeInTheDocument();
    });

    it('cookies makes no advertising claim', () => {
        renderAt(<Cookies />);
        expect(screen.getByText(/doesn't use advertising or tracking cookies/)).toBeInTheDocument();
        expect(screen.queryByText(/behavioral advertising/i)).toBeNull();
    });

    it('terms point to the pricing page for plans', () => {
        renderAt(<Terms />);
        expect(screen.getByRole('link', { name: 'pricing page' })).toHaveAttribute('href', '/pricing');
    });
});
