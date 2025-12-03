import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React ecosystem - loaded on every page
            if (id.includes('react-dom') ||
                (id.includes('/react/') && !id.includes('react-'))) {
              return 'vendor-react';
            }

            // Router - loaded on every page
            if (id.includes('react-router')) {
              return 'vendor-router';
            }

            // Charts & visualization - only loaded when needed
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }

            // Three.js and 3D libraries - only loaded when needed
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-3d';
            }

            // Calendar - only loaded on scheduling pages
            if (id.includes('react-big-calendar') ||
                id.includes('date-fns') ||
                id.includes('react-day-picker')) {
              return 'vendor-calendar';
            }

            // Data fetching & state
            if (id.includes('@tanstack/react-query') ||
                id.includes('@tanstack/query')) {
              return 'vendor-query';
            }

            // Supabase client
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // Forms & validation
            if (id.includes('react-hook-form') ||
                id.includes('@hookform') ||
                id.includes('/zod/')) {
              return 'vendor-forms';
            }

            // Radix UI primitives - split into groups by usage frequency
            if (id.includes('@radix-ui')) {
              // High-frequency Radix components (used on most pages)
              if (id.includes('dialog') ||
                  id.includes('dropdown') ||
                  id.includes('popover') ||
                  id.includes('tooltip') ||
                  id.includes('toast') ||
                  id.includes('slot')) {
                return 'vendor-radix-core';
              }
              // Medium-frequency Radix components
              if (id.includes('select') ||
                  id.includes('checkbox') ||
                  id.includes('radio') ||
                  id.includes('switch') ||
                  id.includes('tabs') ||
                  id.includes('label')) {
                return 'vendor-radix-forms';
              }
              // Lower-frequency Radix components
              return 'vendor-radix-extra';
            }

            // Drag and drop
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }

            // Animations
            if (id.includes('gsap')) {
              return 'vendor-animations';
            }

            // QR code generation (small)
            if (id.includes('/qrcode/') && !id.includes('html5-qrcode')) {
              return 'vendor-qrcode-gen';
            }

            // QR code scanning (large - ZXing based)
            if (id.includes('html5-qrcode')) {
              return 'vendor-qrcode-scan';
            }

            // CSV/data processing
            if (id.includes('papaparse')) {
              return 'vendor-csv';
            }

            // Icons - loaded on every page but cacheable
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            // UI utilities (small, loaded everywhere)
            if (id.includes('clsx') ||
                id.includes('tailwind-merge') ||
                id.includes('class-variance-authority')) {
              return 'vendor-ui-utils';
            }

            // Carousel
            if (id.includes('embla-carousel')) {
              return 'vendor-carousel';
            }

            // Toast notifications
            if (id.includes('sonner')) {
              return 'vendor-toast';
            }

            // Command palette
            if (id.includes('cmdk')) {
              return 'vendor-cmdk';
            }

            // Drawer (vaul)
            if (id.includes('vaul')) {
              return 'vendor-drawer';
            }

            // Onboarding tour
            if (id.includes('react-joyride')) {
              return 'vendor-joyride';
            }

            // Resizable panels
            if (id.includes('react-resizable-panels')) {
              return 'vendor-panels';
            }

            // React Helmet (SEO)
            if (id.includes('react-helmet')) {
              return 'vendor-helmet';
            }

            // Virtualization
            if (id.includes('@tanstack/react-virtual') ||
                id.includes('@tanstack/virtual')) {
              return 'vendor-virtual';
            }

            // Input OTP
            if (id.includes('input-otp')) {
              return 'vendor-otp';
            }

            // Next-themes (dark mode)
            if (id.includes('next-themes')) {
              return 'vendor-themes';
            }

            // Remaining vendor code
            return 'vendor-misc';
          }

          // Application code splitting by feature
          if (id.includes('/components/analytics/')) {
            return 'app-analytics';
          }
          if (id.includes('/components/crm/')) {
            return 'app-crm';
          }
          if (id.includes('/components/ui/')) {
            return 'app-ui-components';
          }
          if (id.includes('/components/billing/')) {
            return 'app-billing';
          }
          if (id.includes('/components/members/')) {
            return 'app-members';
          }
          if (id.includes('/components/staff/')) {
            return 'app-staff';
          }
          if (id.includes('/components/marketing/')) {
            return 'app-marketing';
          }
          if (id.includes('/components/mobile/')) {
            return 'app-mobile';
          }
          if (id.includes('/components/equipment/')) {
            return 'app-equipment';
          }
          if (id.includes('/components/classes/')) {
            return 'app-classes';
          }
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp|ico)$/)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(woff2?|ttf|eot|otf)$/)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    target: 'es2020',
    chunkSizeWarningLimit: 250,
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize CSS
    cssMinify: true,
  },
}));
