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
          // Minimal chunk splitting to avoid circular dependency and load order issues
          if (id.includes('node_modules')) {
            // Charts & visualization (only split recharts - it's large and self-contained)
            if (id.includes('recharts')) {
              return 'charts';
            }
            // Three.js and 3D libraries (only if needed)
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-3d';
            }
            // ALL other vendor code stays together (React, calendar, date-fns, etc.)
            // This prevents circular dependencies and chunk loading order issues
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
        // Keep console.error and console.warn for production debugging
        // Only remove console.log, console.info, console.debug
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    target: 'es2020',
    chunkSizeWarningLimit: 600,
  },
}));
