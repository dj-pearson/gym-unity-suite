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
          // Simplified chunk splitting - keep React with all vendors to avoid load order issues
          if (id.includes('node_modules')) {
            // Charts & visualization (separate because they're large and not always needed)
            if (id.includes('recharts')) {
              return 'charts';
            }
            // Calendar & date utilities (separate because they're large and not always needed)
            if (id.includes('react-big-calendar') || id.includes('date-fns')) {
              return 'calendar';
            }
            // Three.js and 3D libraries (separate because they're large and not always needed)
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-3d';
            }
            // ALL other vendor code including React stays together in one chunk
            // This prevents chunk loading order issues where libraries try to use React before it loads
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
