import { test as base, expect } from '@playwright/test';

/**
 * Custom Test Fixtures
 * Extended test fixtures for E2E testing
 */

// Test user credentials for different roles
export const testUsers = {
  owner: {
    email: 'test-owner@example.com',
    password: 'TestPassword123!',
    role: 'owner',
  },
  manager: {
    email: 'test-manager@example.com',
    password: 'TestPassword123!',
    role: 'manager',
  },
  staff: {
    email: 'test-staff@example.com',
    password: 'TestPassword123!',
    role: 'staff',
  },
  trainer: {
    email: 'test-trainer@example.com',
    password: 'TestPassword123!',
    role: 'trainer',
  },
  member: {
    email: 'test-member@example.com',
    password: 'TestPassword123!',
    role: 'member',
  },
};

// Custom fixture type
interface CustomFixtures {
  authenticatedPage: {
    page: any;
    user: typeof testUsers.owner;
  };
  ownerPage: {
    page: any;
    user: typeof testUsers.owner;
  };
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  // Fixture for an authenticated page session
  authenticatedPage: async ({ page }, use) => {
    // Go to login page
    await page.goto('/auth');

    // Fill in credentials
    await page.getByPlaceholder(/email/i).fill(testUsers.member.email);
    await page.getByPlaceholder(/password/i).fill(testUsers.member.password);

    // Submit login form
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Wait for navigation
    await page.waitForURL(/dashboard|\/$/);

    await use({ page, user: testUsers.member });
  },

  // Fixture for owner-authenticated page
  ownerPage: async ({ page }, use) => {
    await page.goto('/auth');

    await page.getByPlaceholder(/email/i).fill(testUsers.owner.email);
    await page.getByPlaceholder(/password/i).fill(testUsers.owner.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    await page.waitForURL(/dashboard|\/$/);

    await use({ page, user: testUsers.owner });
  },
});

export { expect };

/**
 * Helper function to wait for network to be idle
 */
export async function waitForNetworkIdle(page: any, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper function to take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: any, name: string) {
  await page.screenshot({
    path: `./test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Helper to clear local storage and cookies
 */
export async function clearBrowserState(page: any) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Helper to mock API responses
 */
export async function mockApiResponse(page: any, url: string, response: any) {
  await page.route(url, (route: any) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Helper to wait for toast notification
 */
export async function waitForToast(page: any, text: string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

/**
 * Helper to fill form fields
 */
export async function fillForm(
  page: any,
  fields: { selector: string; value: string }[]
) {
  for (const field of fields) {
    await page.locator(field.selector).fill(field.value);
  }
}

/**
 * Helper to select option from dropdown
 */
export async function selectDropdownOption(
  page: any,
  triggerSelector: string,
  optionText: string
) {
  await page.locator(triggerSelector).click();
  await page.getByRole('option', { name: optionText }).click();
}
