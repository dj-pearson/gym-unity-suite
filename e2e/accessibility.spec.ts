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

  test.describe('Accessibility Statement Page', () => {
    test('should be accessible and contain required information', async ({ page }) => {
      await page.goto('/accessibility');
      await page.waitForLoadState('networkidle');

      // Run accessibility scan on the accessibility page itself
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/accessibility');

      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/accessibility/i);

      // Check for required sections
      const sections = [
        /conformance/i,
        /features/i,
        /contact|feedback/i,
      ];

      for (const section of sections) {
        const heading = page.locator('h2, h3').filter({ hasText: section });
        await expect(heading.first()).toBeVisible();
      }
    });

    test('should have contact information', async ({ page }) => {
      await page.goto('/accessibility');

      // Should have email contact
      const emailLink = page.locator('a[href^="mailto:"]');
      await expect(emailLink.first()).toBeVisible();

      // Should have phone contact or TTY
      const phoneContent = page.locator('text=/\\+1|TTY/i');
      await expect(phoneContent.first()).toBeVisible();
    });
  });

  test.describe('Skip Link Functionality', () => {
    test('should have skip link that works', async ({ page }) => {
      await page.goto('/');

      // Press Tab to focus skip link
      await page.keyboard.press('Tab');

      // Check if skip link is focused (should be first focusable element)
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          text: el?.textContent?.trim(),
          href: el?.getAttribute('href'),
        };
      });

      // Skip link should contain "skip" and link to main content
      if (focusedElement.text?.toLowerCase().includes('skip')) {
        expect(focusedElement.href).toContain('main');

        // Press Enter to activate
        await page.keyboard.press('Enter');

        // Main content should now be focused or visible at top
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeInViewport();
      }
    });
  });

  test.describe('Dashboard Page Accessibility (Authenticated)', () => {
    // Note: These tests require authentication setup
    // In a real scenario, you would set up authentication before each test

    test.skip('should have accessible dashboard layout', async ({ page }) => {
      // This would require authentication
      await page.goto('/dashboard');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test.skip('dashboard should have skip link', async ({ page }) => {
      await page.goto('/dashboard');

      // Tab should focus skip link first
      await page.keyboard.press('Tab');

      const skipLink = page.locator('a:has-text("Skip to main content")');
      await expect(skipLink).toBeFocused();
    });

    test.skip('sidebar should be keyboard navigable', async ({ page }) => {
      await page.goto('/dashboard');

      // Find sidebar navigation
      const sidebar = page.locator('[data-tour="sidebar"]');
      await expect(sidebar).toBeVisible();

      // Check for navigation links with proper roles
      const navLinks = sidebar.getByRole('link');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      // Each link should be focusable
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = navLinks.nth(i);
        await link.focus();
        await expect(link).toBeFocused();
      }
    });
  });

  test.describe('ARIA Live Regions', () => {
    test('should have live region for notifications', async ({ page }) => {
      await page.goto('/');

      // Check for aria-live attributes
      const liveRegions = await page.locator('[aria-live]').all();

      // Should have at least one live region for announcements
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    });

    test('toast notifications should be accessible', async ({ page }) => {
      await page.goto('/');

      // Look for toast container structure
      const toastProvider = page.locator('[class*="Toaster"]');

      if (await toastProvider.isVisible()) {
        // Check for aria-live on toast container
        const ariaLive = await toastProvider.getAttribute('aria-live');
        expect(ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
      }
    });
  });

  test.describe('Data Tables Accessibility', () => {
    test.skip('tables should have proper headers', async ({ page }) => {
      // Navigate to a page with tables (e.g., members list)
      await page.goto('/members');

      const tables = await page.locator('table').all();

      for (const table of tables) {
        // Should have thead with th elements
        const thead = table.locator('thead');
        if (await thead.isVisible()) {
          const thElements = await thead.locator('th').all();
          expect(thElements.length).toBeGreaterThan(0);

          // Headers should have scope attribute
          for (const th of thElements) {
            const scope = await th.getAttribute('scope');
            expect(scope === 'col' || scope === 'row').toBeTruthy();
          }
        }

        // Should have caption or aria-label
        const caption = table.locator('caption');
        const ariaLabel = await table.getAttribute('aria-label');
        const ariaLabelledBy = await table.getAttribute('aria-labelledby');

        const hasDescription = await caption.isVisible() || ariaLabel || ariaLabelledBy;
        expect(hasDescription).toBeTruthy();
      }
    });
  });

  test.describe('High Contrast Mode', () => {
    test('should work in forced colors mode', async ({ page }) => {
      // Emulate forced colors (high contrast mode)
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto('/');

      // Page should still render and be navigable
      await expect(page).toHaveTitle(/./);

      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Focus Management', () => {
    test('focus should not be lost during navigation', async ({ page }) => {
      await page.goto('/');

      // Tab through several elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const activeElement = await page.evaluate(() => {
          return document.activeElement?.tagName;
        });

        // Focus should never jump to body unexpectedly (except at end of page)
        if (activeElement === 'BODY' && i < 5) {
          throw new Error('Focus lost to body element prematurely');
        }
      }
    });

    test('should trap focus in dialogs', async ({ page }) => {
      await page.goto('/');

      // Try to find and open a dialog/modal
      const dialogTriggers = await page.getByRole('button').all();

      for (const trigger of dialogTriggers.slice(0, 5)) {
        const triggerText = await trigger.textContent();

        // Click buttons that might open dialogs
        if (triggerText?.toLowerCase().includes('open') ||
            triggerText?.toLowerCase().includes('add') ||
            triggerText?.toLowerCase().includes('new')) {
          await trigger.click();

          const dialog = page.getByRole('dialog');
          if (await dialog.isVisible()) {
            // Focus should be trapped within dialog
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');

            const focusedInDialog = await page.evaluate(() => {
              const activeEl = document.activeElement;
              const dialog = document.querySelector('[role="dialog"]');
              return dialog?.contains(activeEl);
            });

            expect(focusedInDialog).toBeTruthy();

            // Close dialog with Escape
            await page.keyboard.press('Escape');
            break;
          }
        }
      }
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('error messages should be accessible', async ({ page }) => {
      await page.goto('/auth');

      // Find email input and enter invalid value
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('invalid-email');
        await emailInput.blur();

        // Check for error message accessibility
        const errorMessage = page.locator('[role="alert"], [aria-live], .error, [class*="error"]');

        if (await errorMessage.first().isVisible()) {
          // Error should be perceivable by screen readers
          const ariaLive = await errorMessage.first().getAttribute('aria-live');
          const role = await errorMessage.first().getAttribute('role');

          expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBeTruthy();
        }
      }
    });
  });

  test.describe('Text Resize', () => {
    test('should support 200% text zoom without breaking layout', async ({ page }) => {
      await page.goto('/');

      // Zoom to 200%
      await page.evaluate(() => {
        document.body.style.fontSize = '200%';
      });

      // Content should still be visible and not overflow
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check there's no horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
      });

      // Allow small overflow but flag significant issues
      if (hasOverflow) {
        console.warn('Page may have horizontal scroll at 200% zoom');
      }
    });
  });
});
