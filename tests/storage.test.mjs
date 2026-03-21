/**
 * Unit tests for the SafeStorage class.
 *
 * Source: src/utils/storage.ts
 *
 * We provide a minimal localStorage shim for Node.js since SafeStorage
 * depends on the Web Storage API.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, '..', 'src', 'utils', 'storage.ts'), 'utf-8');

// ---------------------------------------------------------------------------
// Minimal localStorage shim for Node.js
// ---------------------------------------------------------------------------

function createLocalStorageShim() {
  const store = new Map();
  return {
    getItem(key) { return store.get(key) ?? null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    key(index) { return Array.from(store.keys())[index] ?? null; },
    get length() { return store.size; },
    clear() { store.clear(); },
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// Re-implement SafeStorage to mirror production logic without TS compilation.
// ---------------------------------------------------------------------------

function createSafeStorage(localStorageImpl) {
  class SafeStorage {
    constructor(prefix = 'wm') {
      this.prefix = prefix;
      this._ls = localStorageImpl;
    }

    resolveKey(key) {
      return key; // matches production — no prefix transformation
    }

    get(key, defaultValue) {
      try {
        const raw = this._ls.getItem(this.resolveKey(key));
        if (raw === null) return defaultValue;
        const entry = JSON.parse(raw);
        if (entry.e && Date.now() > entry.e) {
          this.remove(key);
          return defaultValue;
        }
        return entry.v ?? defaultValue;
      } catch {
        return defaultValue;
      }
    }

    set(key, value, options) {
      try {
        const entry = {
          v: value,
          t: Date.now(),
          ...(options?.ttlMs ? { e: Date.now() + options.ttlMs } : {}),
        };
        this._ls.setItem(this.resolveKey(key), JSON.stringify(entry));
        return true;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          this.evictOldest();
          try {
            const entry = { v: value, t: Date.now() };
            this._ls.setItem(this.resolveKey(key), JSON.stringify(entry));
            return true;
          } catch {
            return false;
          }
        }
        return false;
      }
    }

    remove(key) {
      try {
        this._ls.removeItem(this.resolveKey(key));
      } catch { /* ignore */ }
    }

    has(key) {
      try {
        return this._ls.getItem(this.resolveKey(key)) !== null;
      } catch {
        return false;
      }
    }

    getRaw(key) {
      try {
        return this._ls.getItem(key);
      } catch {
        return null;
      }
    }

    setRaw(key, value) {
      try {
        this._ls.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }

    removeRaw(key) {
      try {
        this._ls.removeItem(key);
      } catch { /* ignore */ }
    }

    evictOldest() {
      try {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (let i = 0; i < this._ls.length; i++) {
          const key = this._ls.key(i);
          if (!key) continue;
          try {
            const raw = this._ls.getItem(key);
            if (!raw) continue;
            const entry = JSON.parse(raw);
            if (entry.t && entry.t < oldestTime) {
              oldestTime = entry.t;
              oldestKey = key;
            }
          } catch { /* skip */ }
        }
        if (oldestKey) this._ls.removeItem(oldestKey);
      } catch { /* ignore */ }
    }
  }

  return new SafeStorage();
}

// ---------------------------------------------------------------------------
// Source guardrails
// ---------------------------------------------------------------------------

describe('storage source guardrails', () => {
  it('exports a SafeStorage class', () => {
    assert.match(src, /class SafeStorage/);
  });

  it('exports a singleton storage instance', () => {
    assert.match(src, /export const storage\s*=\s*new SafeStorage\(\)/);
  });

  it('wraps values in { v, t, e? } envelope', () => {
    assert.match(src, /v:\s*value/);
    assert.match(src, /t:\s*Date\.now\(\)/);
  });
});

// ---------------------------------------------------------------------------
// get / set with default values
// ---------------------------------------------------------------------------

describe('SafeStorage get/set', () => {
  let ls, storage;

  beforeEach(() => {
    ls = createLocalStorageShim();
    storage = createSafeStorage(ls);
  });

  it('returns default value for missing key', () => {
    assert.equal(storage.get('missing', 'fallback'), 'fallback');
  });

  it('returns stored value after set', () => {
    storage.set('theme', 'dark');
    assert.equal(storage.get('theme', 'light'), 'dark');
  });

  it('stores and retrieves objects', () => {
    const data = { layers: ['protests', 'flights'], zoom: 5 };
    storage.set('config', data);
    assert.deepEqual(storage.get('config', null), data);
  });

  it('stores and retrieves arrays', () => {
    storage.set('list', [1, 2, 3]);
    assert.deepEqual(storage.get('list', []), [1, 2, 3]);
  });

  it('stores and retrieves boolean values', () => {
    storage.set('enabled', false);
    assert.equal(storage.get('enabled', true), false);
  });

  it('returns default for null value (v is null)', () => {
    // Manually write an entry where v is null
    ls.setItem('null-val', JSON.stringify({ v: null, t: Date.now() }));
    assert.equal(storage.get('null-val', 'default'), 'default');
  });

  it('has() returns false for missing key', () => {
    assert.equal(storage.has('nope'), false);
  });

  it('has() returns true for existing key', () => {
    storage.set('exists', 1);
    assert.equal(storage.has('exists'), true);
  });

  it('remove() deletes a key', () => {
    storage.set('temp', 'data');
    storage.remove('temp');
    assert.equal(storage.get('temp', 'gone'), 'gone');
  });

  it('set() returns true on success', () => {
    assert.equal(storage.set('key', 'val'), true);
  });
});

// ---------------------------------------------------------------------------
// TTL expiry
// ---------------------------------------------------------------------------

describe('SafeStorage TTL', () => {
  let ls, storage;

  beforeEach(() => {
    ls = createLocalStorageShim();
    storage = createSafeStorage(ls);
  });

  it('returns value before TTL expires', () => {
    storage.set('key', 'value', { ttlMs: 60_000 });
    assert.equal(storage.get('key', 'default'), 'value');
  });

  it('returns default after TTL expires', async () => {
    // Use a very short TTL
    storage.set('key', 'value', { ttlMs: 50 });
    assert.equal(storage.get('key', 'default'), 'value');

    await new Promise(r => setTimeout(r, 80));
    assert.equal(storage.get('key', 'default'), 'default');
  });

  it('removes the key from storage after TTL expires', async () => {
    storage.set('temp', 'data', { ttlMs: 50 });
    await new Promise(r => setTimeout(r, 80));
    storage.get('temp', 'x'); // triggers removal
    assert.equal(storage.has('temp'), false);
  });

  it('stores without expiry when no TTL given', () => {
    storage.set('permanent', 'data');
    const raw = JSON.parse(ls.getItem('permanent'));
    assert.equal(raw.e, undefined, 'No expiry field expected');
  });

  it('stores expiry field when TTL is given', () => {
    const before = Date.now();
    storage.set('expiring', 'data', { ttlMs: 5000 });
    const raw = JSON.parse(ls.getItem('expiring'));
    assert.ok(raw.e >= before + 5000, 'Expiry should be at least ttlMs in the future');
  });
});

// ---------------------------------------------------------------------------
// getRaw / setRaw
// ---------------------------------------------------------------------------

describe('SafeStorage getRaw/setRaw', () => {
  let ls, storage;

  beforeEach(() => {
    ls = createLocalStorageShim();
    storage = createSafeStorage(ls);
  });

  it('getRaw returns null for missing key', () => {
    assert.equal(storage.getRaw('missing'), null);
  });

  it('setRaw stores a plain string', () => {
    storage.setRaw('raw-key', 'raw-value');
    assert.equal(storage.getRaw('raw-key'), 'raw-value');
  });

  it('setRaw returns true on success', () => {
    assert.equal(storage.setRaw('k', 'v'), true);
  });

  it('getRaw reads values not written by set()', () => {
    ls.setItem('legacy', 'plain-text');
    assert.equal(storage.getRaw('legacy'), 'plain-text');
  });

  it('getRaw does NOT use entry envelope parsing', () => {
    storage.set('wrapped', 'data');
    const raw = storage.getRaw('wrapped');
    // Should be the JSON envelope string, not the unwrapped value
    assert.ok(raw.includes('"v"'), 'getRaw should return raw JSON, not parsed value');
  });

  it('removeRaw deletes a raw key', () => {
    storage.setRaw('temp', 'val');
    storage.removeRaw('temp');
    assert.equal(storage.getRaw('temp'), null);
  });
});

// ---------------------------------------------------------------------------
// Error handling when localStorage throws
// ---------------------------------------------------------------------------

describe('SafeStorage error handling', () => {
  it('get() returns default when localStorage.getItem throws', () => {
    const brokenLs = createLocalStorageShim();
    brokenLs.getItem = () => { throw new Error('denied'); };
    const storage = createSafeStorage(brokenLs);
    assert.equal(storage.get('key', 'safe'), 'safe');
  });

  it('set() returns false when localStorage.setItem throws', () => {
    const brokenLs = createLocalStorageShim();
    brokenLs.setItem = () => { throw new Error('denied'); };
    const storage = createSafeStorage(brokenLs);
    assert.equal(storage.set('key', 'val'), false);
  });

  it('has() returns false when localStorage throws', () => {
    const brokenLs = createLocalStorageShim();
    brokenLs.getItem = () => { throw new Error('denied'); };
    const storage = createSafeStorage(brokenLs);
    assert.equal(storage.has('key'), false);
  });

  it('getRaw() returns null when localStorage throws', () => {
    const brokenLs = createLocalStorageShim();
    brokenLs.getItem = () => { throw new Error('denied'); };
    const storage = createSafeStorage(brokenLs);
    assert.equal(storage.getRaw('key'), null);
  });

  it('setRaw() returns false when localStorage throws', () => {
    const brokenLs = createLocalStorageShim();
    brokenLs.setItem = () => { throw new Error('denied'); };
    const storage = createSafeStorage(brokenLs);
    assert.equal(storage.setRaw('key', 'val'), false);
  });

  it('get() returns default when stored value is malformed JSON', () => {
    const ls = createLocalStorageShim();
    ls.setItem('bad', 'not-json{{{');
    const storage = createSafeStorage(ls);
    assert.equal(storage.get('bad', 'default'), 'default');
  });
});
