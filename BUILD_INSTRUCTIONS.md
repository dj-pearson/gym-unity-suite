# Build Instructions for Cloudflare Pages

## Node.js Version Requirement

This project **requires Node.js version 20 or higher** due to dependencies like:
- `glob@13.0.0`
- `minimatch@10.1.1`
- `path-scurry@2.0.1`
- `lru-cache@11.2.4`

## Cloudflare Pages Configuration

### Setting Node Version in Cloudflare Pages Dashboard

If the build still fails with Node 18, you can manually set the Node version:

1. Go to your Cloudflare Pages dashboard
2. Select your project: `gym-unity-suite`
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Variable name**: `NODE_VERSION`
   - **Value**: `20.11.0`
   - **Environment**: Production (and Preview if needed)
5. Save and redeploy

### Alternative: Use .nvmrc file

The project includes a `.nvmrc` file and `.node-version` file which Cloudflare Pages should automatically detect. If not working, check the dashboard.

## Local Development

To run locally:

```bash
# Ensure you have Node 20+ installed
node --version  # Should be 20.x.x or higher

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Troubleshooting

### Issue: Build succeeds but site shows blank screen

This was caused by Node version mismatch. Symptoms:
- Console error: `Cannot read properties of undefined (reading 'createContext')`
- Background loads but no content
- Build logs show `EBADENGINE` warnings

**Solution**: Ensure Node 20+ is used (see above).

### Issue: Service Worker causing stale JavaScript

The service worker has been updated to use network-first strategy for JavaScript files to prevent caching stale code. If issues persist:

1. Clear browser cache
2. Unregister service worker from DevTools → Application → Service Workers
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Build cache causing problems

If you suspect build cache issues:

1. In Cloudflare Pages dashboard, go to your deployment
2. Click "Retry deployment" with "Clear cache" option
3. Or add a cache-busting commit to trigger a fresh build

## Build Performance

The build is configured with:
- Code splitting for optimal loading
- Terser minification with source map support
- ES2020 target for modern browser support
- Chunk size warnings at 600KB

Typical build time: ~30 seconds
Bundle size: ~2.5MB (uncompressed), ~650KB (gzipped)

