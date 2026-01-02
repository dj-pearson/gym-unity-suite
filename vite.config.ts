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
    mode === 'development' && componentTagger(),
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
        // Manual chunking strategy for optimal bundle splitting
        manualChunks: (id) => {
          // React core and related libraries MUST be first
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-is/') || 
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/object-assign/') ||
              id.includes('node_modules/prop-types/')) {
            return 'vendor-react';
          }
          
          // React Router should be in the react bundle too since UI components may import it
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }

          // Recharts and charting libraries (heavy - separate chunk)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }

          // UI component libraries - these depend on React so ensure stricter matching
          if (id.includes('node_modules/@radix-ui') || 
              id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/cmdk')) {
            return 'vendor-ui-utils';
          }

          // Data fetching and state management
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/@supabase') || id.includes('node_modules/react-query')) {
            return 'vendor-data';
          }

          // Date/time libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/react-big-calendar')) {
            return 'vendor-calendar';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }

          // Other large vendor dependencies
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
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
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'],
      },
      mangle: {
        safari10: true,
      },
    },
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging
    sourcemap: false,
    // Optimize CSS
    cssMinify: true,
  },
}));
