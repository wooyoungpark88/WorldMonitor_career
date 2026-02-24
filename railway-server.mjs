#!/usr/bin/env node
/**
 * Railway production server.
 *
 * Serves the Vite static build (dist/) and dynamically loads all API
 * handlers from api/ — same route-discovery logic used by the Tauri
 * desktop sidecar (src-tauri/sidecar/local-api-server.mjs).
 *
 * Build:  npm run build          (Vite frontend + sebuf TS gateway)
 * Start:  node railway-server.mjs
 *
 * Railway sets $PORT automatically; defaults to 3000 locally.
 */

import { createServer } from 'node:http';
import { readdir, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createReadStream } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { promisify } from 'node:util';
import { brotliCompress } from 'node:zlib';

const brotliCompressAsync = promisify(brotliCompress);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = resolve(__dirname, 'dist');
const API_DIR = resolve(__dirname, 'api');
const PORT = Number(process.env.PORT || 3000);

// ─── MIME types ──────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

// ─── Cache-Control rules (mirrors former vercel.json headers) ────────
function getCacheControl(pathname) {
  if (pathname === '/' || pathname === '/index.html') {
    return 'no-cache, no-store, must-revalidate';
  }
  if (pathname.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable';
  }
  if (pathname.startsWith('/favico/')) {
    return 'public, max-age=604800';
  }
  if (pathname === '/offline.html') {
    return 'public, max-age=86400';
  }
  if (pathname === '/sw.js') {
    return 'public, max-age=0, must-revalidate';
  }
  if (pathname === '/manifest.webmanifest') {
    return 'public, max-age=86400';
  }
  // Default for other static assets
  return 'public, max-age=3600';
}

// ─── PostHog reverse-proxy (mirrors former vercel.json rewrites) ─────
const POSTHOG_REWRITES = [
  { prefix: '/ingest/static/', destination: 'https://us-assets.i.posthog.com/static/' },
  { prefix: '/ingest/', destination: 'https://us.i.posthog.com/' },
];

async function handlePostHogProxy(pathname, req, res) {
  for (const rule of POSTHOG_REWRITES) {
    if (pathname.startsWith(rule.prefix)) {
      const targetPath = pathname.slice(rule.prefix.length);
      const targetUrl = `${rule.destination}${targetPath}`;
      try {
        const proxyRes = await fetch(targetUrl, {
          method: req.method,
          headers: (() => {
            const h = {};
            for (const [k, v] of Object.entries(req.headers)) {
              if (k === 'host') continue;
              if (typeof v === 'string') h[k] = v;
            }
            return h;
          })(),
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req),
        });
        res.writeHead(proxyRes.status, Object.fromEntries(proxyRes.headers.entries()));
        const buf = Buffer.from(await proxyRes.arrayBuffer());
        res.end(buf);
      } catch {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'PostHog proxy failed' }));
      }
      return true;
    }
  }
  return false;
}

// ─── Vercel-style file-system API route discovery ────────────────────

function isBracketSegment(segment) {
  return segment.startsWith('[') && segment.endsWith(']');
}

function splitRoutePath(routePath) {
  return routePath.split('/').filter(Boolean);
}

function routePriority(routePath) {
  const parts = splitRoutePath(routePath);
  return parts.reduce((score, part) => {
    if (part.startsWith('[[...') && part.endsWith(']]')) return score + 0;
    if (part.startsWith('[...') && part.endsWith(']')) return score + 1;
    if (isBracketSegment(part)) return score + 2;
    return score + 10;
  }, 0);
}

function matchRoute(routePath, pathname) {
  const routeParts = splitRoutePath(routePath);
  const pathParts = splitRoutePath(pathname.replace(/^\/api/, ''));

  let i = 0;
  let j = 0;

  while (i < routeParts.length && j < pathParts.length) {
    const routePart = routeParts[i];

    if (routePart.startsWith('[[...') && routePart.endsWith(']]')) return true;
    if (routePart.startsWith('[...') && routePart.endsWith(']')) return true;
    if (isBracketSegment(routePart)) { i++; j++; continue; }
    if (routePart !== pathParts[j]) return false;
    i++; j++;
  }

  if (i === routeParts.length && j === pathParts.length) return true;

  if (i === routeParts.length - 1) {
    const tail = routeParts[i];
    if (tail?.startsWith('[[...') && tail.endsWith(']]')) return true;
    if (tail?.startsWith('[...') && tail.endsWith(']')) return j < pathParts.length;
  }

  return false;
}

async function buildRouteTable(root) {
  if (!existsSync(root)) return [];

  const files = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = join(dir, entry.name);
      if (entry.isDirectory()) { await walk(absolute); continue; }
      if (!entry.name.endsWith('.js')) continue;
      if (entry.name.startsWith('_')) continue;
      if (entry.name.endsWith('.test.js') || entry.name.endsWith('.test.mjs')) continue;

      const rel = relative(root, absolute).replace(/\\/g, '/');
      const routePath = rel.replace(/\.js$/, '').replace(/\/index$/, '');
      files.push({ routePath, modulePath: absolute });
    }
  }

  await walk(root);
  files.sort((a, b) => routePriority(b.routePath) - routePriority(a.routePath));
  return files;
}

function pickModule(pathname, routes) {
  const apiPath = pathname.startsWith('/api') ? pathname.slice(4) || '/' : pathname;
  for (const candidate of routes) {
    if (matchRoute(candidate.routePath, apiPath)) return candidate.modulePath;
  }
  return null;
}

// ─── Module cache ────────────────────────────────────────────────────
const moduleCache = new Map();
const failedImports = new Set();

async function importHandler(modulePath) {
  if (failedImports.has(modulePath)) throw new Error(`cached-failure:${modulePath}`);
  const cached = moduleCache.get(modulePath);
  if (cached) return cached;
  try {
    const mod = await import(pathToFileURL(modulePath).href);
    moduleCache.set(modulePath, mod);
    return mod;
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') failedImports.add(modulePath);
    throw error;
  }
}

// ─── Request body reader ─────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
    req.on('error', reject);
  });
}

// ─── Headers conversion ──────────────────────────────────────────────
function toHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (key === 'host') continue;
    if (Array.isArray(value)) { value.forEach(v => headers.append(key, v)); }
    else if (typeof value === 'string') { headers.set(key, value); }
  }
  return headers;
}

// ─── Static file server ─────────────────────────────────────────────
async function serveStaticFile(pathname, req, res) {
  // Sanitize path to prevent directory traversal
  const safePath = pathname.replace(/\.\./g, '');
  let filePath = join(DIST_DIR, safePath);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
      await stat(filePath); // Check index.html exists
    }
  } catch {
    return false; // File not found
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const cacheControl = getCacheControl(safePath);

  // Check for precompressed .br file
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const brPath = `${filePath}.br`;
  if (acceptEncoding.includes('br') && existsSync(brPath)) {
    const brStat = await stat(brPath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Encoding': 'br',
      'Content-Length': brStat.size,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding',
    });
    createReadStream(brPath).pipe(res);
    return true;
  }

  const fileStat2 = await stat(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': fileStat2.size,
    'Cache-Control': cacheControl,
  });
  createReadStream(filePath).pipe(res);
  return true;
}

// ─── SPA fallback: serve index.html for non-file routes ─────────────
async function serveSpaFallback(res) {
  const indexPath = join(DIST_DIR, 'index.html');
  try {
    const content = await readFile(indexPath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

// ─── API request handler ─────────────────────────────────────────────
async function handleApiRequest(pathname, search, req, res, routes) {
  const requestUrl = new URL(`${pathname}${search}`, `http://localhost:${PORT}`);
  const modulePath = pickModule(pathname, routes);

  if (!modulePath || !existsSync(modulePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', endpoint: pathname }));
    return;
  }

  try {
    const mod = await importHandler(modulePath);
    if (typeof mod.default !== 'function') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid handler module' }));
      return;
    }

    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
    const request = new Request(requestUrl.toString(), {
      method: req.method,
      headers: toHeaders(req.headers),
      body,
    });

    const response = await mod.default(request);

    if (!(response instanceof Response)) {
      console.error(`[api] ${pathname} handler returned non-Response`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Handler returned invalid response' }));
      return;
    }

    const responseBody = Buffer.from(await response.arrayBuffer());
    const headers = Object.fromEntries(response.headers.entries());
    res.writeHead(response.status, headers);
    res.end(responseBody);
  } catch (error) {
    console.error(`[api] ${pathname} error:`, error.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Handler error', reason: error.message }));
  }
}

// ─── Main server ─────────────────────────────────────────────────────
async function main() {
  // Build route table from api/ directory
  const routes = await buildRouteTable(API_DIR);
  console.log(`[railway] Discovered ${routes.length} API routes`);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(url.pathname);

    try {
      // 1. PostHog proxy rewrites
      if (pathname.startsWith('/ingest/')) {
        const handled = await handlePostHogProxy(pathname, req, res);
        if (handled) return;
      }

      // 2. API routes
      if (pathname.startsWith('/api/')) {
        await handleApiRequest(pathname, url.search, req, res, routes);
        return;
      }

      // 3. Static files from dist/
      const served = await serveStaticFile(pathname, req, res);
      if (served) return;

      // 4. SPA fallback — serve index.html for client-side routing
      await serveSpaFallback(res);
    } catch (error) {
      console.error(`[railway] Unhandled error for ${pathname}:`, error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[railway] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[railway] Serving static files from ${DIST_DIR}`);
    console.log(`[railway] API routes from ${API_DIR}`);
  });
}

main().catch((error) => {
  console.error('[railway] Startup failed:', error);
  process.exit(1);
});
