import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Plugin to ensure vendor-react loads before other vendor chunks
const prioritizeReactLoading = (): Plugin => ({
  name: 'prioritize-react-loading',
  transformIndexHtml(html) {
    // Reorder modulepreload links to ensure vendor-react comes first
    const lines = html.split('\n');
    const reactPreloadIndex = lines.findIndex(line => line.includes('vendor-react') && line.includes('modulepreload'));
    
    if (reactPreloadIndex > 0) {
      const reactLine = lines[reactPreloadIndex];
      const firstPreloadIndex = lines.findIndex(line => line.includes('modulepreload') && line.includes('/assets/js/'));
      
      if (firstPreloadIndex >= 0 && firstPreloadIndex < reactPreloadIndex) {
        // Remove React preload from its current position
        lines.splice(reactPreloadIndex, 1);
        // Insert it at the first preload position
        lines.splice(firstPreloadIndex, 0, reactLine);
      }
    }
    
    return lines.join('\n');
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    prioritizeReactLoading(),
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
            // Core React ecosystem + ALL React-dependent libraries
            // MUST be loaded first before any other code
            if (id.includes('react-dom') || 
                id.includes('/react/') || 
                id.includes('\\react\\') ||
                id.includes('scheduler') ||
                id.includes('prop-types') ||
                id.includes('use-sync-external-store') ||
                id.includes('react-is') ||
                id.includes('hoist-non-react-statics') ||
                id.includes('object-assign') ||
                id.includes('@radix-ui') ||  // ALL Radix UI
                id.includes('react-router') || // React Router
                id.includes('react-hook-form') || // Forms
                id.includes('@hookform') ||
                id.includes('/zod') || // Zod validation (Unix paths)
                id.includes('\\zod') || // Zod validation (Windows paths)
                id.includes('react-helmet') || // SEO
                id.includes('react-joyride') || // Tours
                id.includes('framer-motion') || // Animations (uses React)
                id.includes('react-transition-group') || // Transitions
                id.includes('react-remove-scroll') || // Scroll locking
                id.includes('react-style-singleton') || // Style injection
                id.includes('get-nonce') || // CSP
                id.includes('use-callback-ref') || // React hooks
                id.includes('use-sidecar') || // React hooks
                id.includes('detect-node-es') || // Used by React libs
                id.includes('aria-hidden') || // Accessibility (Radix dependency)
                id.includes('react-focus-lock') || // Focus management
                id.includes('react-focus-on') || // Focus management
                id.includes('react-resizable-panels') || // Panels
                id.includes('@tanstack/react-virtual') || // Virtualization
                id.includes('@tanstack/virtual') || // Virtualization core
                id.includes('@tanstack/react-query') || // React Query
                id.includes('@tanstack/query') || // Query core
                id.includes('cmdk') || // Command menu
                id.includes('vaul') || // Drawer
                id.includes('sonner') || // Toast
                id.includes('input-otp')) { // OTP input
              return 'vendor-react';
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

            // Supabase client
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }

            // Radix UI and Zod are now bundled with vendor-react above

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
