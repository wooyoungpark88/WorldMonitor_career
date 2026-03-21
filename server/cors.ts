/**
 * CORS header generation -- TypeScript port of api/_cors.js.
 *
 * Origin patterns are imported from the shared _cors-patterns module so
 * that server/cors.ts and api/_cors.js stay in sync.  Methods are
 * hardcoded to 'POST, OPTIONS' (all sebuf routes are POST).
 */

declare const process: { env: Record<string, string | undefined> };

import { PRODUCTION_PATTERNS, DEV_PATTERNS } from './_cors-patterns';

const ALLOWED_ORIGIN_PATTERNS: RegExp[] =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_PATTERNS
    : [...PRODUCTION_PATTERNS, ...DEV_PATTERNS];

function isAllowedOrigin(origin: string): boolean {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://worldmonitor.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-WorldMonitor-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function isDisallowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
