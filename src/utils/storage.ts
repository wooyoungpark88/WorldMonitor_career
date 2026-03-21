/**
 * Safe localStorage wrapper with error handling, compression, and TTL support.
 */

interface StorageOptions {
  ttlMs?: number; // Time-to-live in milliseconds
}

interface StorageEntry<T> {
  v: T;        // value
  t: number;   // timestamp
  e?: number;  // expiry timestamp
}

class SafeStorage {
  constructor() {
    // no-op — prefix reserved for future namespacing
  }

  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(this.resolveKey(key));
      if (raw === null) return defaultValue;

      const entry: StorageEntry<T> = JSON.parse(raw);

      // Check TTL
      if (entry.e && Date.now() > entry.e) {
        this.remove(key);
        return defaultValue;
      }

      return entry.v ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T, options?: StorageOptions): boolean {
    try {
      const entry: StorageEntry<T> = {
        v: value,
        t: Date.now(),
        ...(options?.ttlMs ? { e: Date.now() + options.ttlMs } : {}),
      };
      localStorage.setItem(this.resolveKey(key), JSON.stringify(entry));
      return true;
    } catch (e) {
      // Quota exceeded - try to evict old entries
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.evictOldest();
        try {
          const entry: StorageEntry<T> = { v: value, t: Date.now() };
          localStorage.setItem(this.resolveKey(key), JSON.stringify(entry));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.resolveKey(key));
    } catch { /* ignore */ }
  }

  has(key: string): boolean {
    try {
      return localStorage.getItem(this.resolveKey(key)) !== null;
    } catch {
      return false;
    }
  }

  // Raw access for migration keys that don't use the entry format
  getRaw(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setRaw(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  removeRaw(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }

  private resolveKey(key: string): string {
    return key; // Keep existing keys for backwards compat
  }

  private evictOldest(): void {
    try {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const entry = JSON.parse(raw);
          if (entry.t && entry.t < oldestTime) {
            oldestTime = entry.t;
            oldestKey = key;
          }
        } catch { /* skip non-JSON entries */ }
      }

      if (oldestKey) {
        localStorage.removeItem(oldestKey);
      }
    } catch { /* ignore */ }
  }
}

export const storage = new SafeStorage();
