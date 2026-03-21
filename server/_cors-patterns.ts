/**
 * Shared CORS origin patterns.
 *
 * Canonical source of truth for allowed origins used by both:
 *   - server/cors.ts  (TypeScript, sebuf routes)
 *   - api/_cors.js    (JavaScript, Vercel serverless — imports manually synced)
 */

export const PRODUCTION_PATTERNS: RegExp[] = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/.*\.up\.railway\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
];

export const DEV_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];
