/**
 * CORS origin patterns — keep in sync with server/_cors-patterns.ts.
 * Cannot import directly due to JS/TS boundary in Vercel serverless.
 */
const PRODUCTION_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/.*\.up\.railway\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
];

const DEV_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

const ALLOWED_ORIGIN_PATTERNS =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_PATTERNS
    : [...PRODUCTION_PATTERNS, ...DEV_PATTERNS];

function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function getCorsHeaders(req, methods = 'GET, OPTIONS') {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://worldmonitor.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-WorldMonitor-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function isDisallowedOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
