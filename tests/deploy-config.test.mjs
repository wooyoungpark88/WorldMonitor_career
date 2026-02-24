import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const viteConfigSource = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf-8');
const railwayServerSource = readFileSync(resolve(__dirname, '../railway-server.mjs'), 'utf-8');

describe('deploy/cache configuration guardrails', () => {
  it('has railway.toml instead of vercel.json', () => {
    assert.ok(existsSync(resolve(__dirname, '../railway.toml')), 'railway.toml should exist');
    assert.ok(!existsSync(resolve(__dirname, '../vercel.json')), 'vercel.json should not exist');
  });

  it('railway server disables caching for HTML entry routes', () => {
    assert.match(railwayServerSource, /no-cache, no-store, must-revalidate/);
  });

  it('railway server keeps immutable caching for hashed static assets', () => {
    assert.match(railwayServerSource, /max-age=31536000, immutable/);
  });

  it('keeps PWA precache glob free of HTML files', () => {
    assert.match(
      viteConfigSource,
      /globPatterns:\s*\['\*\*\/\*\.\{js,css,ico,png,svg,woff2\}'\]/
    );
    assert.doesNotMatch(viteConfigSource, /globPatterns:\s*\['\*\*\/\*\.\{js,css,html/);
  });

  it('explicitly disables navigateFallback when HTML is not precached', () => {
    assert.match(viteConfigSource, /navigateFallback:\s*null/);
    assert.doesNotMatch(viteConfigSource, /navigateFallbackDenylist:\s*\[/);
  });

  it('uses network-first runtime caching for navigation requests', () => {
    assert.match(viteConfigSource, /request\.mode === 'navigate'/);
    assert.match(viteConfigSource, /handler:\s*'NetworkFirst'/);
    assert.match(viteConfigSource, /cacheName:\s*'html-navigation'/);
  });

  it('contains variant-specific metadata fields used by html replacement and manifest', () => {
    assert.match(viteConfigSource, /shortName:\s*'/);
    assert.match(viteConfigSource, /subject:\s*'/);
    assert.match(viteConfigSource, /classification:\s*'/);
    assert.match(viteConfigSource, /categories:\s*\[/);
    assert.match(
      viteConfigSource,
      /\.replace\(\/<meta name="subject" content="\.\*\?" \\\/>\/,\s*`<meta name="subject"/
    );
    assert.match(
      viteConfigSource,
      /\.replace\(\/<meta name="classification" content="\.\*\?" \\\/>\/,\s*`<meta name="classification"/
    );
  });
});
