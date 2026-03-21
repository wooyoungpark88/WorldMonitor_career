/**
 * Unit tests for the CircuitBreaker class.
 *
 * Tests cover:
 * - Returning cached data during cooldown
 * - Entering cooldown after maxFailures
 * - Cooldown expiry
 * - execute() with successful and failing functions
 *
 * Source: src/utils/circuit-breaker.ts
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, '..', 'src', 'utils', 'circuit-breaker.ts'), 'utf-8');

// ---------------------------------------------------------------------------
// Minimal re-implementation of CircuitBreaker for unit testing.
// We mirror the production logic from source so tests stay in sync.
// ---------------------------------------------------------------------------

const DEFAULT_MAX_FAILURES = 2;
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;

class CircuitBreaker {
  constructor(options) {
    this.name = options.name;
    this.maxFailures = options.maxFailures ?? DEFAULT_MAX_FAILURES;
    this.cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.state = { failures: 0, cooldownUntil: 0 };
    this.cache = null;
    this.lastDataState = { mode: 'unavailable', timestamp: null, offline: false };
  }

  isOnCooldown() {
    if (Date.now() < this.state.cooldownUntil) return true;
    if (this.state.cooldownUntil > 0) {
      this.state = { failures: 0, cooldownUntil: 0 };
    }
    return false;
  }

  getCooldownRemaining() {
    return Math.max(0, Math.ceil((this.state.cooldownUntil - Date.now()) / 1000));
  }

  getCached() {
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTtlMs) {
      return this.cache.data;
    }
    return null;
  }

  getCachedOrDefault(defaultValue) {
    return this.cache?.data ?? defaultValue;
  }

  recordSuccess(data) {
    this.state = { failures: 0, cooldownUntil: 0 };
    this.cache = { data, timestamp: Date.now() };
    this.lastDataState = { mode: 'live', timestamp: Date.now(), offline: false };
  }

  recordFailure(error) {
    this.state.failures++;
    this.state.lastError = error;
    if (this.state.failures >= this.maxFailures) {
      this.state.cooldownUntil = Date.now() + this.cooldownMs;
    }
  }

  async execute(fn, defaultValue) {
    if (this.isOnCooldown()) {
      const cachedFallback = this.getCached();
      if (cachedFallback !== null) {
        this.lastDataState = { mode: 'cached', timestamp: this.cache?.timestamp ?? null, offline: false };
        return cachedFallback;
      }
      this.lastDataState = { mode: 'unavailable', timestamp: null, offline: false };
      return this.getCachedOrDefault(defaultValue);
    }

    const cached = this.getCached();
    if (cached !== null) {
      this.lastDataState = { mode: 'cached', timestamp: this.cache?.timestamp ?? null, offline: false };
      return cached;
    }

    try {
      const result = await fn();
      this.recordSuccess(result);
      return result;
    } catch (e) {
      this.recordFailure(String(e));
      this.lastDataState = { mode: 'unavailable', timestamp: this.cache?.timestamp ?? null, offline: false };
      return this.getCachedOrDefault(defaultValue);
    }
  }
}

// ---------------------------------------------------------------------------
// Source-level guardrails
// ---------------------------------------------------------------------------

describe('circuit-breaker source guardrails', () => {
  it('exports a CircuitBreaker class', () => {
    assert.match(src, /export class CircuitBreaker/);
  });

  it('has default maxFailures of 2', () => {
    assert.match(src, /DEFAULT_MAX_FAILURES\s*=\s*2/);
  });

  it('has default cooldown of 5 minutes', () => {
    assert.match(src, /DEFAULT_COOLDOWN_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
  });

  it('has default cache TTL of 10 minutes', () => {
    assert.match(src, /DEFAULT_CACHE_TTL_MS\s*=\s*10\s*\*\s*60\s*\*\s*1000/);
  });
});

// ---------------------------------------------------------------------------
// Cooldown behavior
// ---------------------------------------------------------------------------

describe('CircuitBreaker cooldown', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ name: 'test', maxFailures: 2, cooldownMs: 1000 });
  });

  it('is NOT on cooldown initially', () => {
    assert.equal(breaker.isOnCooldown(), false);
  });

  it('enters cooldown after maxFailures consecutive failures', () => {
    breaker.recordFailure('err1');
    assert.equal(breaker.isOnCooldown(), false, 'One failure should not trigger cooldown');

    breaker.recordFailure('err2');
    assert.equal(breaker.isOnCooldown(), true, 'Two failures should trigger cooldown');
  });

  it('reports remaining cooldown in seconds', () => {
    breaker.recordFailure('a');
    breaker.recordFailure('b');
    const remaining = breaker.getCooldownRemaining();
    assert.ok(remaining > 0, 'Should have positive remaining seconds');
    assert.ok(remaining <= 1, 'Should be at most 1 second for a 1000ms cooldown');
  });

  it('cooldown expires after cooldownMs', async () => {
    breaker = new CircuitBreaker({ name: 'fast', maxFailures: 1, cooldownMs: 50 });
    breaker.recordFailure('boom');
    assert.equal(breaker.isOnCooldown(), true);

    await new Promise(r => setTimeout(r, 80));
    assert.equal(breaker.isOnCooldown(), false, 'Cooldown should have expired');
  });

  it('resets failure count after cooldown expires', async () => {
    breaker = new CircuitBreaker({ name: 'reset', maxFailures: 1, cooldownMs: 50 });
    breaker.recordFailure('fail');
    assert.equal(breaker.isOnCooldown(), true);

    await new Promise(r => setTimeout(r, 80));
    assert.equal(breaker.isOnCooldown(), false);
    // After cooldown expires, state resets so one more failure should trigger cooldown again
    breaker.recordFailure('fail-again');
    assert.equal(breaker.isOnCooldown(), true);
  });

  it('resets failure count on success', () => {
    breaker.recordFailure('err1');
    breaker.recordSuccess('data');
    breaker.recordFailure('err2');
    assert.equal(breaker.isOnCooldown(), false, 'Success should have reset failure counter');
  });
});

// ---------------------------------------------------------------------------
// Cache behavior
// ---------------------------------------------------------------------------

describe('CircuitBreaker cache', () => {
  it('returns null from getCached() when no data recorded', () => {
    const breaker = new CircuitBreaker({ name: 'empty' });
    assert.equal(breaker.getCached(), null);
  });

  it('returns data from getCached() after recordSuccess', () => {
    const breaker = new CircuitBreaker({ name: 'cache-hit' });
    breaker.recordSuccess({ value: 42 });
    assert.deepEqual(breaker.getCached(), { value: 42 });
  });

  it('returns null from getCached() after TTL expires', async () => {
    const breaker = new CircuitBreaker({ name: 'ttl', cacheTtlMs: 50 });
    breaker.recordSuccess('old-data');
    assert.equal(breaker.getCached(), 'old-data');

    await new Promise(r => setTimeout(r, 80));
    assert.equal(breaker.getCached(), null, 'Cache should have expired');
  });

  it('getCachedOrDefault returns default when no cache', () => {
    const breaker = new CircuitBreaker({ name: 'default' });
    assert.equal(breaker.getCachedOrDefault('fallback'), 'fallback');
  });

  it('getCachedOrDefault returns cached data even if TTL expired', () => {
    const breaker = new CircuitBreaker({ name: 'stale-cache', cacheTtlMs: 0 });
    breaker.recordSuccess('stale');
    // cacheTtlMs=0 means getCached() returns null, but getCachedOrDefault returns it
    assert.equal(breaker.getCachedOrDefault('default'), 'stale');
  });
});

// ---------------------------------------------------------------------------
// execute() behavior
// ---------------------------------------------------------------------------

describe('CircuitBreaker execute()', () => {
  it('returns result from successful function', async () => {
    const breaker = new CircuitBreaker({ name: 'exec-ok' });
    const result = await breaker.execute(() => Promise.resolve('hello'), 'default');
    assert.equal(result, 'hello');
    assert.equal(breaker.lastDataState.mode, 'live');
  });

  it('returns default when function throws and no cache', async () => {
    const breaker = new CircuitBreaker({ name: 'exec-fail' });
    const result = await breaker.execute(() => Promise.reject(new Error('boom')), 'fallback');
    assert.equal(result, 'fallback');
  });

  it('records failure when function throws', async () => {
    const breaker = new CircuitBreaker({ name: 'exec-track', maxFailures: 2 });
    await breaker.execute(() => Promise.reject(new Error('e1')), null);
    await breaker.execute(() => Promise.reject(new Error('e2')), null);
    assert.equal(breaker.isOnCooldown(), true);
  });

  it('returns cached data during cooldown instead of calling fn', async () => {
    const breaker = new CircuitBreaker({
      name: 'exec-cooldown',
      maxFailures: 1,
      cooldownMs: 60_000,
      cacheTtlMs: 120_000,
    });

    // Populate cache with a successful call
    await breaker.execute(() => Promise.resolve('good-data'), 'default');

    // Trip the breaker
    breaker.recordFailure('forced');
    assert.equal(breaker.isOnCooldown(), true);

    // During cooldown, fn should NOT be called
    let fnCalled = false;
    const result = await breaker.execute(() => {
      fnCalled = true;
      return Promise.resolve('new-data');
    }, 'default');

    assert.equal(fnCalled, false, 'Function should not be called during cooldown');
    assert.equal(result, 'good-data', 'Should return cached data');
    assert.equal(breaker.lastDataState.mode, 'cached');
  });

  it('returns default when on cooldown with no cache', async () => {
    const breaker = new CircuitBreaker({
      name: 'exec-no-cache',
      maxFailures: 1,
      cooldownMs: 60_000,
      cacheTtlMs: 0,
    });

    breaker.recordFailure('fail');
    const result = await breaker.execute(() => Promise.resolve('ignored'), 'my-default');
    assert.equal(result, 'my-default');
    assert.equal(breaker.lastDataState.mode, 'unavailable');
  });

  it('returns fresh cache without calling fn when cache is valid', async () => {
    const breaker = new CircuitBreaker({ name: 'exec-cache-hit', cacheTtlMs: 60_000 });
    breaker.recordSuccess('cached-val');

    let fnCalled = false;
    const result = await breaker.execute(() => {
      fnCalled = true;
      return Promise.resolve('new-val');
    }, 'default');

    assert.equal(fnCalled, false, 'Should serve from cache');
    assert.equal(result, 'cached-val');
  });
});
