# Clear Cache and Service Worker - User Instructions

## The Problem

Your site is showing a blank page with the error:
```
Cannot read properties of undefined (reading 'createContext')
```

This is caused by **old cached JavaScript files** in your browser's service worker cache.

## Solution: Clear Everything

### Option 1: Hard Refresh (Try This First)

**On Windows/Linux:**
1. Hold **Ctrl + Shift**
2. Press **R**
3. Release all keys

**On Mac:**
1. Hold **Cmd + Shift**  
2. Press **R**
3. Release all keys

If this doesn't work, continue to Option 2.

---

### Option 2: Clear Service Worker & Cache (Most Reliable)

#### Google Chrome / Microsoft Edge:

1. Open **Developer Tools** (F12 or right-click → Inspect)
2. Go to the **Application** tab (or **Storage** tab in some versions)
3. In the left sidebar, find **Service Workers**
4. Click **"Unregister"** next to the service worker entry
5. In the left sidebar, find **Cache Storage**
6. Right-click each cache entry and click **Delete**
7. Still in the Application tab, find **Storage** in the left sidebar
8. Click **"Clear site data"** button at the top
9. Check all boxes and click **Clear**
10. Close DevTools
11. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)

#### Firefox:

1. Open **Developer Tools** (F12)
2. Go to **Storage** tab
3. In the left sidebar, expand **Cache Storage**
4. Right-click each cache and select **Delete All**
5. Go to **Service Workers** in the left sidebar
6. Click **Unregister** for any service workers
7. Close DevTools
8. Press **Ctrl+Shift+Delete** (or **Cmd+Shift+Delete** on Mac)
9. Select **Everything** for time range
10. Check:
    - Cookies
    - Cache
    - Site Data
11. Click **Clear Now**
12. Reload the page

#### Safari:

1. Open **Safari Preferences** (Cmd+,)
2. Go to **Advanced** tab
3. Enable **"Show Develop menu in menu bar"**
4. Close Preferences
5. Click **Develop** in menu bar → **Empty Caches**
6. Click **Develop** → **Disable Service Workers**
7. Click **Safari** → **Clear History**
8. Select **All History** and click **Clear History**
9. Reload the page

---

### Option 3: Incognito/Private Mode Test

To verify the fix worked:

1. Open a new **Incognito** (Chrome) or **Private** (Firefox/Safari) window
2. Visit your site: https://repclub.net
3. If it works in incognito, the issue is definitely cached data
4. Follow Option 2 above to clear your normal browser

---

### Option 4: Nuclear Option - Clear Everything

If none of the above work:

**Chrome/Edge:**
1. Go to **chrome://settings/clearBrowserData**
2. Select **All time** for time range
3. Check ALL boxes:
   - Browsing history
   - Download history
   - Cookies and other site data
   - Cached images and files
   - Passwords and other sign-in data (optional)
   - Autofill form data (optional)
4. Click **Clear data**
5. Restart browser
6. Visit site

**Firefox:**
1. Go to **about:preferences#privacy**
2. Under **Cookies and Site Data**, click **Clear Data**
3. Check all boxes
4. Click **Clear**
5. Restart Firefox
6. Visit site

---

## For Mobile Devices

### iOS (Safari):

1. Go to **Settings** → **Safari**
2. Scroll down and tap **Advanced**
3. Tap **Website Data**
4. Find your site and swipe left to delete
5. Or tap **Remove All Website Data** at bottom
6. Go back and tap **Clear History and Website Data**
7. Restart Safari
8. Visit site

### Android (Chrome):

1. Open Chrome
2. Tap **⋮** (three dots) → **Settings**
3. Tap **Privacy and Security**
4. Tap **Clear browsing data**
5. Select **Advanced** tab
6. Select **All time**
7. Check:
   - Cookies and site data
   - Cached images and files
8. Tap **Clear data**
9. Visit site

---

## Verify It's Fixed

After clearing, you should see:

1. ✅ Site loads completely (not just background)
2. ✅ No errors in console (F12 → Console tab)
3. ✅ You should see: `[App] SW registered successfully` in console

## Prevention

After the fix:
- The new service worker will automatically serve fresh files
- You shouldn't need to do this again
- The issue was a one-time deployment problem

## Still Not Working?

If the site still doesn't load after all of these steps:

1. Take a screenshot of the browser console (F12 → Console)
2. Note your browser version and operating system
3. Try a different browser to isolate the issue
4. Contact support with the details

## Technical Details (For Developers)

The issue was caused by:
1. Node 18 build creating incompatible vendor bundles
2. Service worker aggressively caching these broken files
3. Browser serving cached broken files even after new deployment

The fix deployed:
1. Updated to Node 20 for builds
2. Improved chunk splitting to prevent React initialization issues
3. Updated service worker to never cache vendor bundles
4. Added aggressive service worker update checks
5. Bumped service worker cache version to force refresh

