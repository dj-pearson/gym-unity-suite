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
        // Let Vite/Rollup automatically handle vendor chunking based on dependency graph
        // This prevents circular dependency issues from manual chunking
        manualChunks: undefined,
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
