/**
 * Service Worker Configuration Helper
 *
 * Stores Supabase configuration in IndexedDB so the service worker
 * can access it for offline sync operations.
 *
 * @module lib/pwa/swConfig
 */

import { supabaseConfig } from '@/integrations/supabase/client';

const DB_NAME = 'gym-unity-offline';
const DB_VERSION = 2;
const CONFIG_STORE = 'config';

/**
 * Opens the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create config store if it doesn't exist
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE);
      }

      // Create pending-check-ins store if it doesn't exist
      if (!db.objectStoreNames.contains('pending-check-ins')) {
        db.createObjectStore('pending-check-ins', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Stores the Supabase configuration in IndexedDB for service worker access
 */
export async function storeSupabaseConfigForSW(): Promise<void> {
  try {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      console.warn('[SW Config] Supabase config not available, skipping SW config storage');
      return;
    }

    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONFIG_STORE], 'readwrite');
      const store = transaction.objectStore(CONFIG_STORE);

      const config = {
        url: supabaseConfig.url,
        anonKey: supabaseConfig.anonKey,
        functionsUrl: supabaseConfig.functionsUrl,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(config, 'supabase');

      request.onsuccess = () => {
        console.log('[SW Config] Supabase config stored for service worker');
        resolve();
      };

      request.onerror = () => {
        console.error('[SW Config] Failed to store config:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[SW Config] Error storing Supabase config:', error);
  }
}

/**
 * Initialize SW config storage
 * Call this early in app initialization
 */
export function initSWConfig(): void {
  // Store config when the app loads
  storeSupabaseConfigForSW();

  // Also update config when the page becomes visible (in case of updates)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      storeSupabaseConfigForSW();
    }
  });
}
