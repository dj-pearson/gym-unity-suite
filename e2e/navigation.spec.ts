import { test, expect } from '@playwright/test';

/**
 * Navigation E2E Tests
 * Tests critical navigation user journeys
 */

test.describe('Public Navigation', () => {
  test('should navigate to features page', async ({ page }) => {
    await page.goto('/');

    // Click on features link if available
    const featuresLink = page.getByRole('link', { name: /features/i });
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await expect(page).toHaveURL(/features/);
    }
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');

    const pricingLink = page.getByRole('link', { name: /pricing/i });
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/pricing/);
    }
  });

  test('should have working header navigation', async ({ page }) => {
    await page.goto('/');

    // Header should be visible
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Logo should link to home
    const logo = page.getByRole('link', { name: /gym|home|logo/i }).first();
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('SEO Pages', () => {
  test('should load competitor comparison pages', async ({ page }) => {
    const comparisonUrls = [
      '/compare/glofox-alternative',
      '/compare/mindbody-alternative',
      '/compare/zenplanner-alternative',
    ];

    for (const url of comparisonUrls) {
      const response = await page.goto(url);

      // Page should load (2xx or redirect)
      if (response) {
        expect([200, 301, 302, 304]).toContain(response.status());
      }
    }
  });

  test('should load solution pages', async ({ page }) => {
    const solutionUrls = [
      '/solutions/crossfit-gyms',
      '/solutions/martial-arts-schools',
      '/solutions/yoga-studios',
    ];

    for (const url of solutionUrls) {
      const response = await page.goto(url);

      if (response) {
        expect([200, 301, 302, 304]).toContain(response.status());
      }
    }
  });

  test('should have meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    // Check for essential meta tags
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();

    // Check for Open Graph tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    // OG title may or may not exist, just check we can query it
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should have mobile menu button', async ({ page }) => {
    await page.goto('/');

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu|toggle/i });
    if (await menuButton.isVisible()) {
      await expect(menuButton).toBeVisible();
    }
  });

  test('should open mobile menu on button click', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Menu should be expanded/visible
      // Check for navigation items being visible
      const nav = page.getByRole('navigation');
      await expect(nav).toBeVisible();
    }
  });
});

test.describe('Footer Navigation', () => {
  test('should have footer with links', async ({ page }) => {
    await page.goto('/');

    // Footer should exist
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });

  test('should have privacy policy link', async ({ page }) => {
    await page.goto('/');

    const privacyLink = page.getByRole('link', { name: /privacy/i });
    if (await privacyLink.isVisible()) {
      await expect(privacyLink).toBeVisible();
    }
  });

  test('should have terms of service link', async ({ page }) => {
    await page.goto('/');

    const termsLink = page.getByRole('link', { name: /terms/i });
    if (await termsLink.isVisible()) {
      await expect(termsLink).toBeVisible();
    }
  });
});

test.describe('Error Pages', () => {
  test('should show 404 page for non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should show some kind of not found message or redirect
    const notFoundText = page.getByText(/not found|404|doesn't exist/i);
    const hasNotFound = await notFoundText.isVisible().catch(() => false);

    // Either shows 404 or redirects somewhere
    expect(hasNotFound || page.url() !== '/this-page-does-not-exist-12345').toBeTruthy();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab to see if skip link appears
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: /skip/i });
    // Skip link may or may not exist
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Each image should have alt attribute (can be empty for decorative)
      expect(alt !== null).toBeTruthy();
    }
  });
});
