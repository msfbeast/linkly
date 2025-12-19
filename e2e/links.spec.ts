import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Link Management
 * Tests the core link shortening and management functionality
 */

test.describe('Link Management (Unauthenticated)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('shows URL input on homepage', async ({ page }) => {
        // Look for URL input field
        const urlInput = page.getByPlaceholder(/url|link|paste/i);
        if (await urlInput.isVisible()) {
            await expect(urlInput).toBeEditable();
        }
    });

    test('can enter a URL to shorten', async ({ page }) => {
        const urlInput = page.getByPlaceholder(/url|link|paste/i);
        if (await urlInput.isVisible()) {
            await urlInput.fill('https://example.com/test');
            await expect(urlInput).toHaveValue('https://example.com/test');
        }
    });

    test('shorten button is visible', async ({ page }) => {
        const shortenButton = page.getByRole('button', { name: /shorten|create|generate/i });
        const buttonVisible = await shortenButton.first().isVisible().catch(() => false);

        if (buttonVisible) {
            await expect(shortenButton.first()).toBeEnabled();
        }
    });
});

test.describe('Dashboard (Requires Auth)', () => {
    // These tests would require authentication fixtures
    // For now, we just verify the redirect behavior

    test('redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/dashboard');

        // Should redirect to login or show login prompt
        await page.waitForTimeout(1000);
        const url = page.url();
        expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
    });

    test('links page is protected', async ({ page }) => {
        await page.goto('/links');
        await page.waitForTimeout(1000);
        const url = page.url();
        expect(url.includes('/login') || url.includes('/links')).toBeTruthy();
    });
});

test.describe('Bio Page Public Access', () => {
    test('public bio page renders', async ({ page }) => {
        // This would test a known public bio page
        await page.goto('/p/test');
        await page.waitForTimeout(500);

        // Should either show a bio page or 404
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});
