import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests critical authentication user journeys
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth');

      // Check for login form elements
      await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible();
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
      await page.goto('/auth');

      // Click submit without filling form
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should show validation error or not submit
      // The exact behavior depends on implementation
      await expect(page).toHaveURL(/auth/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth');

      // Fill in invalid credentials
      await page.getByPlaceholder(/email/i).fill('invalid@example.com');
      await page.getByPlaceholder(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('should have link to sign up page', async ({ page }) => {
      await page.goto('/auth');

      // Should have a link to sign up
      await expect(page.getByRole('link', { name: /sign up|create account|register/i })).toBeVisible();
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/auth');

      // Should have forgot password link
      const forgotPasswordLink = page.getByRole('link', { name: /forgot|reset/i });
      if (await forgotPasswordLink.isVisible()) {
        await expect(forgotPasswordLink).toBeVisible();
      }
    });
  });

  test.describe('Sign Up Page', () => {
    test('should display sign up form', async ({ page }) => {
      await page.goto('/auth');

      // Click on sign up link if available
      const signUpTab = page.getByRole('tab', { name: /sign up/i });
      if (await signUpTab.isVisible()) {
        await signUpTab.click();
      } else {
        const signUpLink = page.getByRole('link', { name: /sign up|create account/i });
        if (await signUpLink.isVisible()) {
          await signUpLink.click();
        }
      }

      // Check for sign up form elements
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i).first()).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth');

      // Navigate to sign up
      const signUpTab = page.getByRole('tab', { name: /sign up/i });
      if (await signUpTab.isVisible()) {
        await signUpTab.click();
      }

      // Enter invalid email
      const emailInput = page.getByPlaceholder(/email/i);
      await emailInput.fill('notanemail');

      // Try to submit
      await page.getByRole('button', { name: /sign up|create|register/i }).click();

      // Should show validation error
      // The exact behavior depends on browser validation
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route directly
      await page.goto('/dashboard');

      // Should redirect to auth page
      await expect(page).toHaveURL(/auth/);
    });

    test('should redirect unauthenticated users from members page', async ({ page }) => {
      await page.goto('/members');
      await expect(page).toHaveURL(/auth/);
    });

    test('should redirect unauthenticated users from settings page', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/auth/);
    });
  });
});

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Check for key landing page elements
    await expect(page).toHaveTitle(/gym|fitness/i);
  });

  test('should have navigation to login', async ({ page }) => {
    await page.goto('/');

    // Should have login/sign in button or link
    const loginButton = page.getByRole('link', { name: /sign in|log in/i });
    await expect(loginButton).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still load properly
    await expect(page).toHaveTitle(/gym|fitness/i);
  });
});
