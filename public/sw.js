// Service Worker for RepClub PWA
const CACHE_NAME = 'repclub-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/RepClub-Logo.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event - stale-while-revalidate for faster responses
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Cache valid responses
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Return offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return cache.match('/');
          }
        });

        // Return cached response immediately if available, then update cache
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from RepClub',
    icon: '/RepClub-Logo.png',
    badge: '/RepClub-Logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/RepClub-Logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/RepClub-Logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('RepClub', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '[]');
    
    for (const item of offlineData) {
      if (item.sync_status === 'pending') {
        try {
          // Attempt to sync each item
          await fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item.data)
          });
          
          // Mark as synced
          item.sync_status = 'synced';
        } catch (error) {
          console.error('Failed to sync item:', error);
          item.sync_status = 'error';
        }
      }
    }
    
    // Update localStorage with sync status
    localStorage.setItem('offline_data', JSON.stringify(offlineData));
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}