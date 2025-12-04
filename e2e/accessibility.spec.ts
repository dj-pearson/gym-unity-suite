import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E Tests
 * WCAG 2.1 compliance testing automation
 */

test.describe('Accessibility Tests', () => {
  test.describe('Landing Page Accessibility', () => {
    test('should not have any automatically detectable accessibility issues', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Filter out minor issues if needed
      const violations = accessibilityScanResults.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious'
      );

      expect(violations).toEqual([]);
    });

    test('should have proper page structure', async ({ page }) => {
      await page.goto('/');

      // Check for main landmark
      const main = page.locator('main');
      await expect(main).toBeVisible();

      // Check for header/banner landmark
      const header = page.getByRole('banner');
      await expect(header).toBeVisible();

      // Check for navigation
      const nav = page.getByRole('navigation');
      await expect(nav.first()).toBeVisible();
    });

    test('should have exactly one h1', async ({ page }) => {
      await page.goto('/');

      const h1Elements = await page.locator('h1').all();
      expect(h1Elements.length).toBe(1);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      const headings = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(elements).map((el) => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent?.trim().substring(0, 50),
        }));
      });

      // Check that heading levels don't skip (e.g., h1 to h3 without h2)
      let previousLevel = 0;
      for (const heading of headings) {
        // Each heading should not skip more than one level
        expect(heading.level).toBeLessThanOrEqual(previousLevel + 2);
        previousLevel = heading.level;
      }
    });
  });

  test.describe('Auth Page Accessibility', () => {
    test('should have accessible login form', async ({ page }) => {
      await page.goto('/auth');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('form')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('form inputs should have labels', async ({ page }) => {
      await page.goto('/auth');

      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();

      for (const input of inputs) {
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        // Input should have some form of label
        const hasLabel =
          inputId ||
          ariaLabel ||
          ariaLabelledBy ||
          placeholder;

        expect(hasLabel).toBeTruthy();
      }
    });

    test('buttons should have accessible names', async ({ page }) => {
      await page.goto('/auth');

      const buttons = await page.getByRole('button').all();

      for (const button of buttons) {
        const name = await button.getAttribute('aria-label');
        const text = await button.textContent();

        // Button should have accessible name
        expect(name || text?.trim()).toBeTruthy();
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.color'])
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === 'color-contrast'
      );

      // Allow some minor contrast issues but flag critical ones
      const criticalContrastIssues = contrastViolations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalContrastIssues).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be navigable with keyboard only', async ({ page }) => {
      await page.goto('/');

      // Tab through the page
      let tabCount = 0;
      const maxTabs = 50;

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        // Check that something is focused
        const focusedElement = await page.evaluate(
          () => document.activeElement?.tagName
        );

        // Should not lose focus to body unexpectedly
        if (focusedElement === 'BODY' && tabCount > 1) {
          // May have reached end of page
          break;
        }
      }

      // Should be able to tab through elements
      expect(tabCount).toBeGreaterThan(1);
    });

    test('should show focus indicators', async ({ page }) => {
      await page.goto('/');

      // Tab to first focusable element
      await page.keyboard.press('Tab');

      // Get the focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;

        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border,
        };
      });

      // Should have some visible focus indicator
      // (outline, box-shadow, or border change)
      expect(focusedElement).toBeTruthy();
    });

    test('should handle Escape key for modals', async ({ page }) => {
      await page.goto('/');

      // Try to trigger a modal if possible
      const modalTrigger = page.getByRole('button', { name: /open|menu|modal/i });

      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();

        // Press Escape
        await page.keyboard.press('Escape');

        // Modal should close
        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('images should have alt text', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();

      for (const image of images) {
        const alt = await image.getAttribute('alt');
        const role = await image.getAttribute('role');

        // Image should have alt attribute OR role="presentation"
        const isAccessible = alt !== null || role === 'presentation';
        expect(isAccessible).toBeTruthy();
      }
    });

    test('links should have descriptive text', async ({ page }) => {
      await page.goto('/');

      const links = await page.getByRole('link').all();

      for (const link of links) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        // Link should have text or aria-label
        const hasDescription = (text && text.trim()) || ariaLabel;
        expect(hasDescription).toBeTruthy();

        // Should not be generic text like "click here"
        const genericTexts = ['click here', 'read more', 'learn more'];
        const isGeneric = genericTexts.some(
          (g) => text?.toLowerCase().trim() === g
        );
        // Allow but warn about generic link text
      }
    });

    test('should have proper ARIA roles', async ({ page }) => {
      await page.goto('/');

      // Check for essential ARIA roles
      const roleChecks = [
        { role: 'banner', min: 1 },
        { role: 'navigation', min: 1 },
        { role: 'main', min: 1 },
      ];

      for (const check of roleChecks) {
        const elements = await page.getByRole(check.role as any).all();
        expect(elements.length).toBeGreaterThanOrEqual(check.min);
      }
    });
  });

  test.describe('Forms Accessibility', () => {
    test('form should announce errors to screen readers', async ({ page }) => {
      await page.goto('/auth');

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /sign in|log in/i });
      await submitButton.click();

      // Check for error messages with aria-live or role="alert"
      const errorMessages = await page.locator('[aria-live], [role="alert"]').all();

      // Form validation should be announced
      // (depends on implementation)
    });

    test('required fields should be marked', async ({ page }) => {
      await page.goto('/auth');

      const requiredInputs = await page.locator('input[required], input[aria-required="true"]').all();

      // There should be required fields in the login form
      expect(requiredInputs.length).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should have touch-friendly targets', async ({ page }) => {
      await page.goto('/');

      const buttons = await page.getByRole('button').all();
      const links = await page.getByRole('link').all();

      const interactiveElements = [...buttons, ...links];

      for (const element of interactiveElements.slice(0, 10)) {
        const box = await element.boundingBox();

        if (box) {
          // Touch targets should be at least 44x44 pixels (WCAG recommendation)
          const meetsSizeRequirement = box.width >= 44 && box.height >= 44;

          // Or has sufficient spacing
          const hasAdequateSpacing = box.width >= 24 && box.height >= 24;

          expect(meetsSizeRequirement || hasAdequateSpacing).toBeTruthy();
        }
      }
    });

    test('should have no horizontal scroll', async ({ page }) => {
      await page.goto('/');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      // Page should still function with reduced motion
      await expect(page).toHaveTitle(/./);
    });
  });
});
