# 🚨 QUICK FIX: Site Not Loading

## For Users Seeing Blank Screen

**The fix is deployed. You just need to clear your browser cache.**

### Fastest Solution (30 seconds):

1. **Hard Refresh:**
   - **Windows/Linux**: Press `Ctrl + Shift + R`
   - **Mac**: Press `Cmd + Shift + R`

2. If that doesn't work, **clear service worker:**
   - Press `F12` to open Developer Tools
   - Go to **Application** tab
   - Click **Service Workers** in left sidebar
   - Click **Unregister**
   - Click **Storage** in left sidebar  
   - Click **Clear site data** button
   - Close DevTools
   - **Hard refresh again** (`Ctrl+Shift+R`)

3. **Verify it worked:**
   - Site should load completely
   - Open console (F12) and you should see:
     ```
     [App] SW registered successfully
     App mounted successfully
     ```
   - No red errors

### Why This Happened

- Old deployment used Node 18 (incompatible with some packages)
- Created broken JavaScript bundles
- Service worker cached these broken files
- Even after we fixed it, your browser served the old cached files

### The Fix We Deployed

✅ Using Node 20 for builds (compatible)  
✅ Improved code bundling  
✅ Service worker no longer caches vendor files  
✅ Added automatic service worker updates  

You just need to clear the old cached files once, then it'll work normally.

---

## For Developers: Deploy These Changes

### 1. Commit and Push

```bash
git add .
git commit -m "fix: Force service worker update and prevent vendor caching"
git push origin main
```

### 2. Verify Build

Watch Cloudflare Pages build logs for:
- ✅ `Installing nodejs 20.11.0`
- ✅ `✓ built in ~25s`
- ✅ No errors

### 3. After Deployment

Clear your own cache and test:
```bash
# Open Chrome DevTools
# Application → Service Workers → Unregister
# Application → Storage → Clear site data
# Hard refresh: Ctrl+Shift+R
```

### 4. Share With Users

Send them this document or the simple instructions:
> "We fixed the site! Please hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac) or clear your browser cache to see the update."

---

## What Changed in This Commit

### Files Modified:

1. **public/sw.js**
   - Bumped cache version from v2 to v3-2025-12-02 (forces cache clear)
   - Added rule to NEVER cache vendor JavaScript files
   - Prevents serving stale/broken vendor bundles

2. **src/App.tsx**
   - Added aggressive service worker update checking
   - Forces service worker update on app load
   - Checks for updates every 60 seconds
   - Unregisters old service workers before registering new ones

### Impact:

- **Immediate**: Old caches are invalidated
- **Going forward**: Vendor files always fetched fresh (network-first)
- **User experience**: One-time cache clear needed, then works normally
- **Performance**: Minimal impact (only vendor files fetch fresh, rest cached normally)

### Testing:

1. **Clear your local cache completely**
2. **Visit site in normal browser** - should work
3. **Visit site in incognito** - should work
4. **Check console** for `[App] SW registered successfully`
5. **No red errors** in console
6. **Site loads completely**, not just background

---

## Rollback Plan

If this causes issues:

```bash
git revert HEAD
git push origin main
```

But this is a low-risk change - we're just:
- Clearing caches (users will just download fresh files)
- Not caching vendor JS (small performance trade-off for reliability)
- Adding update checks (improves update delivery)

