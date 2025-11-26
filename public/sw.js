// Enhanced Service Worker for Gym Unity Suite PWA
const CACHE_VERSION = 'v2';
const CACHE_NAME = `gym-unity-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Cache strategies by resource type
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/RepClub-Icon.png'
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Strategy 1: Network-first for API calls
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Strategy 2: Cache-first for static assets
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Strategy 3: Stale-while-revalidate for HTML pages
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    throw error;
  }
}

// Network-first strategy (for API calls)
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale-while-revalidate strategy (for HTML pages)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(async () => {
      // If network fails and we have no cache, show offline page
      if (!cached) {
        const offlinePage = await cache.match(OFFLINE_PAGE);
        if (offlinePage) {
          return offlinePage;
        }
      }
      throw new Error('Offline and no cache available');
    });

  return cached || fetchPromise;
}

// Network with cache fallback
async function networkWithCacheFallback(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Background sync for check-ins
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-check-ins') {
    event.waitUntil(syncCheckIns());
  }
});

async function syncCheckIns() {
  try {
    console.log('[SW] Syncing pending check-ins...');

    // Get pending check-ins from IndexedDB
    const pendingCheckIns = await getPendingCheckIns();

    if (pendingCheckIns.length === 0) {
      console.log('[SW] No pending check-ins to sync');
      return Promise.resolve();
    }

    console.log(`[SW] Found ${pendingCheckIns.length} pending check-ins`);

    // Sync each check-in
    const results = await Promise.allSettled(
      pendingCheckIns.map(async (checkIn) => {
        try {
          // Remove IndexedDB-specific fields
          const { id, created_at, retries, ...checkInData } = checkIn;

          // Get Supabase configuration from environment
          // Note: In production, you'd configure this properly
          const supabaseUrl = self.location.origin.includes('localhost')
            ? 'YOUR_SUPABASE_URL'
            : 'YOUR_SUPABASE_URL';
          const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

          // Sync to Supabase
          const response = await fetch(`${supabaseUrl}/rest/v1/check_ins`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(checkInData),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Remove from IndexedDB on success
          await removePendingCheckIn(id);

          console.log(`[SW] Successfully synced check-in: ${id}`);
          return { success: true, id };
        } catch (error) {
          // Increment retry count
          await incrementCheckInRetries(checkIn.id);

          // If retried too many times (>5), remove it
          if ((checkIn.retries || 0) >= 5) {
            console.error(`[SW] Removing check-in after 5 failed retries: ${checkIn.id}`);
            await removePendingCheckIn(checkIn.id);
          }

          console.error(`[SW] Failed to sync check-in ${checkIn.id}:`, error);
          return { success: false, id: checkIn.id, error };
        }
      })
    );

    const synced = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - synced;

    console.log(`[SW] Check-ins sync complete: ${synced} synced, ${failed} failed`);

    // If any failed, reject to trigger retry
    if (failed > 0) {
      return Promise.reject(new Error(`${failed} check-ins failed to sync`));
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    return Promise.reject(error);
  }
}

// IndexedDB helpers for service worker
const DB_NAME = 'gym-unity-offline';
const STORES = {
  PENDING_CHECK_INS: 'pending-check-ins',
};

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingCheckIns() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingCheckIn(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function incrementCheckInRetries(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const checkIn = getRequest.result;
      if (checkIn) {
        checkIn.retries = (checkIn.retries || 0) + 1;
        const updateRequest = store.put(checkIn);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Gym Unity Suite';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/RepClub-Icon.png',
    badge: '/RepClub-Icon.png',
    tag: data.tag || 'notification',
    data: data,
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

console.log('[SW] Service worker loaded');
