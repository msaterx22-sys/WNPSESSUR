const DB_NAME = 'wisdom-school-db';
const STORE_NAME = 'records';

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open IndexedDB.'));
  });
};

export const indexedDbStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const db = await openDatabase();
      return await new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const value = request.result;
          resolve(typeof value === 'string' ? value : null);
        };

        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('IndexedDB write failed.'));
      });
      return true;
    } catch {
      return false;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch {
      // Ignore cleanup errors.
    }
  },
};

export const safeBrowserStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`localStorage quota exceeded while saving "${key}". Falling back to IndexedDB.`, error);
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore cleanup errors.
    }
  },

  async saveJson(key: string, value: string): Promise<void> {
    const saved = safeBrowserStorage.setItem(key, value);
    if (!saved) {
      await indexedDbStorage.setItem(key, value);
    }
  },

  async loadJson(key: string): Promise<string | null> {
    const localValue = safeBrowserStorage.getItem(key);
    if (localValue !== null) {
      return localValue;
    }

    return await indexedDbStorage.getItem(key);
  },

  async clearJson(key: string): Promise<void> {
    safeBrowserStorage.removeItem(key);
    await indexedDbStorage.removeItem(key);
  },
};
