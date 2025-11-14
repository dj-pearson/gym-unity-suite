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
          // Split vendor chunks for better caching and parallel loading
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-react';
            }
            // UI component libraries (Radix UI)
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Data & state management
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-data';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-data';
            }
            // Charts & visualization
            if (id.includes('recharts')) {
              return 'charts';
            }
            // Calendar & date utilities
            if (id.includes('react-big-calendar') || id.includes('date-fns')) {
              return 'calendar';
            }
            // Remaining vendor code
            return 'vendor';
          }
          // Split large component directories
          if (id.includes('/components/analytics/')) {
            return 'analytics';
          }
          if (id.includes('/components/crm/')) {
            return 'crm';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    target: 'es2015',
    chunkSizeWarningLimit: 600,
  },
}));
