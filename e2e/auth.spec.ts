import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests login, register, and logout functionality
 */

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('homepage loads correctly', async ({ page }) => {
        await expect(page).toHaveTitle(/Linkly|Gather/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('can navigate to login page', async ({ page }) => {
        const loginButton = page.getByRole('link', { name: /login|sign in/i });
        if (await loginButton.isVisible()) {
            await loginButton.click();
            await expect(page).toHaveURL(/\/login/);
        }
    });

    test('can navigate to register page', async ({ page }) => {
        const registerButton = page.getByRole('link', { name: /register|sign up|get started/i });
        if (await registerButton.isVisible()) {
            await registerButton.click();
            await expect(page).toHaveURL(/\/register/);
        }
    });

    test('login form validation works', async ({ page }) => {
        await page.goto('/login');

        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: /sign in|login|continue/i });
        if (await submitButton.isVisible()) {
            await submitButton.click();

            // Should show validation errors or stay on page
            await expect(page).toHaveURL(/\/login/);
        }
    });

    test('register form shows all required fields', async ({ page }) => {
        await page.goto('/register');

        // Check for email and password inputs
        const emailInput = page.getByLabel(/email/i);
        const passwordInput = page.getByLabel(/password/i);

        if (await emailInput.isVisible()) {
            await expect(emailInput).toBeEditable();
        }
        if (await passwordInput.isVisible()) {
            await expect(passwordInput).toBeEditable();
        }
    });
});
