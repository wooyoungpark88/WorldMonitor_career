/**
 * Simple in-memory rate limiter for API endpoints.
 * Uses sliding window counters per IP.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();
const MAX_ENTRIES = 10000; // Prevent memory leak

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,     // 120 requests per minute
};

export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = clientId;

  // Evict if map too large
  if (limits.size > MAX_ENTRIES) {
    const cutoff = now - config.windowMs;
    for (const [k, v] of limits) {
      if (v.resetAt < cutoff) limits.delete(k);
    }
  }

  const entry = limits.get(key);

  if (!entry || now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetAt - now);

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

export function getRateLimitHeaders(result: { remaining: number; resetIn: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
  };
}
