/**
 * IndexedDB Helper for Offline Data Storage
 *
 * Manages local storage for offline capabilities, particularly for
 * check-ins and other actions that should sync when back online
 */

const DB_NAME = 'gym-unity-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  PENDING_CHECK_INS: 'pending-check-ins',
  PENDING_ACTIONS: 'pending-actions',
} as const;

export interface PendingCheckIn {
  id: string;
  member_id: string;
  organization_id: string;
  checked_in_at: string;
  notes?: string;
  location?: string;
  metadata?: Record<string, any>;
  retries?: number;
  created_at: string;
}

export interface PendingAction {
  id: string;
  type: string;
  data: any;
  retries?: number;
  created_at: string;
}

/**
 * Initialize IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create pending check-ins store
      if (!db.objectStoreNames.contains(STORES.PENDING_CHECK_INS)) {
        const checkInsStore = db.createObjectStore(STORES.PENDING_CHECK_INS, {
          keyPath: 'id',
        });
        checkInsStore.createIndex('member_id', 'member_id', { unique: false });
        checkInsStore.createIndex('organization_id', 'organization_id', {
          unique: false,
        });
        checkInsStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Create pending actions store
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const actionsStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
          keyPath: 'id',
        });
        actionsStore.createIndex('type', 'type', { unique: false });
        actionsStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

/**
 * Add a pending check-in
 */
export async function addPendingCheckIn(
  checkIn: Omit<PendingCheckIn, 'id' | 'created_at' | 'retries'>
): Promise<string> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const pendingCheckIn: PendingCheckIn = {
    id,
    ...checkIn,
    created_at,
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const request = store.add(pendingCheckIn);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending check-ins
 */
export async function getPendingCheckIns(): Promise<PendingCheckIn[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending check-ins by organization
 */
export async function getPendingCheckInsByOrg(
  organizationId: string
): Promise<PendingCheckIn[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const index = store.index('organization_id');
    const request = index.getAll(organizationId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a pending check-in
 */
export async function removePendingCheckIn(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update retry count for a pending check-in
 */
export async function incrementCheckInRetries(id: string): Promise<void> {
  const db = await initDB();

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
        resolve(); // Check-in doesn't exist, nothing to update
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Clear all pending check-ins
 */
export async function clearPendingCheckIns(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a pending action
 */
export async function addPendingAction(
  action: Omit<PendingAction, 'id' | 'created_at' | 'retries'>
): Promise<string> {
  const db = await initDB();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const pendingAction: PendingAction = {
    id,
    ...action,
    created_at,
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.add(pendingAction);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending actions
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a pending action
 */
export async function removePendingAction(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear old pending items (older than 7 days)
 */
export async function clearOldPendingItems(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffTime = sevenDaysAgo.toISOString();

  const db = await initDB();

  // Clear old check-ins
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_CHECK_INS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_CHECK_INS);
    const index = store.index('created_at');
    const range = IDBKeyRange.upperBound(cutoffTime);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });

  // Clear old actions
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_ACTIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_ACTIONS);
    const index = store.index('created_at');
    const range = IDBKeyRange.upperBound(cutoffTime);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });
}
