# Cloudflare Pages Setup Guide

## Build Configuration

Set these values in your Cloudflare Pages dashboard:

### Build Settings

1. **Framework preset**: `None` or `Vite`
2. **Build command**: `npm run build:pages`
3. **Build output directory**: `dist`
4. **Root directory**: `/` (leave empty)

### Environment Variables

Set these in Cloudflare Pages dashboard → Settings → Environment Variables:

#### Required Variables

```env
NODE_VERSION=20.11.0
VITE_SUPABASE_URL=https://api.repclub.net
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Optional Variables (if needed)

```env
VITE_GA_ID=your_google_analytics_id
```

## Node Version

The Node.js version is controlled by:
- `.nvmrc` file (already in repo)
- `.node-version` file (already in repo)

Cloudflare Pages will automatically detect and use Node 20.11.0.

## Build Process

When you push to GitHub:
1. Cloudflare Pages detects the push
2. Reads `wrangler.toml` for output directory (`dist`)
3. Installs dependencies: `npm install`
4. Runs build command: `npm run build:pages`
5. Deploys the `dist` folder

## Build Command Breakdown

The `build:pages` script does:
```bash
vite build                  # Build the React app
cp public/_headers dist/    # Copy Cloudflare headers
cp public/_redirects dist/  # Copy redirect rules
```

## Troubleshooting

### Build Fails with "npm ERR! code EUSAGE"

**Solution**: Ensure the build command in Cloudflare dashboard is exactly:
```
npm run build:pages
```
NOT:
- `npm build:pages` ❌
- `npm build` ❌
- `build:pages` ❌

### Build Succeeds but Site is Blank

**Solution**: Check that environment variables are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### "Module not found" Errors

**Solution**: Clear Cloudflare Pages build cache:
1. Go to Cloudflare Pages dashboard
2. Go to Deployments
3. Click "..." on latest deployment
4. Click "Retry deployment" with "Clear cache" checked

## Deployment URLs

After successful deployment:
- **Production**: `https://gym-unity-suite.pages.dev`
- **Custom Domain**: Configure in Cloudflare Pages → Custom Domains

## Verifying Deployment

1. Check build logs in Cloudflare Pages dashboard
2. Visit your deployment URL
3. Check browser console for errors
4. Verify Supabase connection works

## Files Required for Cloudflare Pages

- ✅ `wrangler.toml` - Cloudflare configuration
- ✅ `.nvmrc` - Node version specification
- ✅ `.node-version` - Alternative Node version spec
- ✅ `package.json` - Dependencies and build scripts
- ✅ `public/_headers` - HTTP headers for Cloudflare
- ✅ `public/_redirects` - URL redirect rules
- ✅ `dist/` - Build output (generated during build)

## Next Steps

1. Commit the changes:
   ```bash
   git add wrangler.toml .node-version
   git commit -m "fix: Update Cloudflare Pages configuration"
   git push origin main
   ```

2. Go to Cloudflare Pages dashboard

3. Verify build settings match this guide

4. Trigger new deployment or wait for automatic deploy

5. Monitor build logs for success

---

**Note**: The `[build.environment]` section has been removed from `wrangler.toml` as it's not supported by Cloudflare Pages. Node version is now controlled by `.nvmrc` and `.node-version` files instead.

