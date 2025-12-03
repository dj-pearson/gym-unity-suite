/**
 * Lighthouse CI Configuration
 *
 * This configuration defines performance budgets and audit settings
 * for automated Lighthouse testing in CI/CD pipelines.
 *
 * Usage:
 *   npm install -g @lhci/cli
 *   lhci autorun
 *
 * Or in CI:
 *   lhci autorun --upload.target=temporary-public-storage
 */

module.exports = {
  ci: {
    collect: {
      // Static server configuration for built assets
      staticDistDir: './dist',

      // Number of runs per URL (median score used)
      numberOfRuns: 3,

      // URLs to test (relative to static server)
      url: [
        'http://localhost/',
        'http://localhost/login',
        'http://localhost/features',
      ],

      // Puppeteer settings for consistent results
      settings: {
        // Use mobile preset for realistic testing
        preset: 'desktop',

        // Throttling to simulate real-world conditions
        throttling: {
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 40,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 10240,
        },

        // Skip audits that require network
        skipAudits: [
          'uses-http2',
          'canonical',
          'is-crawlable',
        ],

        // Only run performance-related audits for speed
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
    },

    assert: {
      // Assertion presets
      preset: 'lighthouse:recommended',

      assertions: {
        // Performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 4000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3500 }],

        // Category scores (0-1 scale)
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Bundle size
        'total-byte-weight': ['warn', { maxNumericValue: 500000 }],
        'unminified-javascript': 'off',
        'unminified-css': 'off',

        // Resource hints
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',

        // Images
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'warn',

        // JavaScript
        'unused-javascript': 'warn',
        'legacy-javascript': 'warn',
        'duplicated-javascript': 'error',

        // CSS
        'unused-css-rules': 'warn',

        // Caching
        'uses-long-cache-ttl': 'warn',

        // Accessibility (relaxed for SPA)
        'color-contrast': 'warn',
        'heading-order': 'warn',
        'link-name': 'warn',
        'button-name': 'warn',

        // SEO (relaxed for authenticated routes)
        'document-title': 'warn',
        'meta-description': 'warn',
        'hreflang': 'off',
        'plugins': 'off',

        // PWA
        'service-worker': 'off',
        'installable-manifest': 'off',
        'themed-omnibox': 'off',
        'maskable-icon': 'off',
        'splash-screen': 'off',

        // Network
        'render-blocking-resources': 'warn',
        'uses-text-compression': 'warn',
        'efficient-animated-content': 'warn',

        // DOM
        'dom-size': ['warn', { maxNumericValue: 1500 }],

        // Third-party
        'third-party-summary': 'off',
        'third-party-facades': 'off',

        // Off for SPAs
        'redirects': 'off',
        'uses-http2': 'off',
      },
    },

    upload: {
      // Use temporary public storage for CI (free, expires in 7 days)
      target: 'temporary-public-storage',

      // Or use a Lighthouse CI server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.example.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};
