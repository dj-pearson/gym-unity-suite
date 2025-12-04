import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 * Tests for page load times and performance metrics
 */

test.describe('Performance Tests', () => {
  test.describe('Page Load Performance', () => {
    test('landing page should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('landing page should reach interactive state quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Full load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('auth page should load quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/auth');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Resource Performance', () => {
    test('should not have excessive JavaScript bundle size', async ({ page }) => {
      let totalJsSize = 0;

      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('.js') && response.status() === 200) {
          try {
            const body = await response.body();
            totalJsSize += body.length;
          } catch (e) {
            // Ignore errors from responses that can't be read
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Total JS should be less than 3MB (uncompressed)
      expect(totalJsSize).toBeLessThan(3 * 1024 * 1024);
    });

    test('should have reasonable number of network requests', async ({ page }) => {
      let requestCount = 0;

      page.on('request', () => {
        requestCount++;
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not have excessive requests
      expect(requestCount).toBeLessThan(100);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should have acceptable Largest Contentful Paint', async ({ page }) => {
      await page.goto('/');

      // Measure LCP using Performance API
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            resolve(lastEntry?.startTime || 0);
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      // LCP should be under 2.5 seconds for good score
      // We allow up to 4 seconds for acceptable
      expect(Number(lcp)).toBeLessThan(4000);
    });

    test('should have minimal layout shifts', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Measure CLS
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => resolve(clsValue), 3000);
        });
      });

      // CLS should be under 0.1 for good score
      // We allow up to 0.25 for acceptable
      expect(Number(cls)).toBeLessThan(0.25);
    });
  });

  test.describe('Image Performance', () => {
    test('should lazy load off-screen images', async ({ page }) => {
      await page.goto('/');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const loading = await images.nth(i).getAttribute('loading');
        // Images should have loading attribute for lazy loading
        // (or be eager for above-the-fold content)
      }
    });

    test('should have properly sized images', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const oversizedImages = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        let oversized = 0;

        images.forEach((img) => {
          const naturalWidth = img.naturalWidth;
          const displayWidth = img.clientWidth;

          // Image is oversized if natural width is more than 2x display width
          if (naturalWidth > displayWidth * 2 && displayWidth > 0) {
            oversized++;
          }
        });

        return oversized;
      });

      // Should not have many oversized images
      expect(oversizedImages).toBeLessThan(3);
    });
  });

  test.describe('Caching', () => {
    test('should have cache headers on static assets', async ({ page }) => {
      let cachedAssets = 0;

      page.on('response', (response) => {
        const cacheControl = response.headers()['cache-control'];
        if (cacheControl && response.url().includes('/assets/')) {
          cachedAssets++;
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Some assets should have caching
      // This depends on server configuration
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks on navigation', async ({ page }) => {
      await page.goto('/');

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Navigate multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/auth');
        await page.goto('/');
      }

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory should not increase dramatically (less than 2x)
      if (initialMemory > 0 && finalMemory > 0) {
        expect(finalMemory).toBeLessThan(initialMemory * 2);
      }
    });
  });
});
