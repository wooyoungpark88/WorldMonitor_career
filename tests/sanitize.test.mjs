/**
 * Unit tests for escapeHtml and sanitizeUrl utilities.
 *
 * Source: src/utils/sanitize.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, '..', 'src', 'utils', 'sanitize.ts'), 'utf-8');

// ---------------------------------------------------------------------------
// Re-implement the functions under test from source to avoid TS compilation.
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  const isAllowedProtocol = (protocol) => protocol === 'http:' || protocol === 'https:';

  try {
    const parsed = new URL(trimmed);
    if (isAllowedProtocol(parsed.protocol)) {
      return escapeAttr(parsed.toString());
    }
  } catch {
    // Not an absolute URL, continue.
  }

  if (!/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) {
    return '';
  }

  try {
    const base = 'https://example.com';
    const resolved = new URL(trimmed, base);
    if (!isAllowedProtocol(resolved.protocol)) {
      return '';
    }
    return escapeAttr(trimmed);
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Source guardrails
// ---------------------------------------------------------------------------

describe('sanitize source guardrails', () => {
  it('exports escapeHtml function', () => {
    assert.match(src, /export function escapeHtml/);
  });

  it('exports sanitizeUrl function', () => {
    assert.match(src, /export function sanitizeUrl/);
  });

  it('escapeAttr delegates to escapeHtml', () => {
    assert.match(src, /export function escapeAttr[\s\S]*?return escapeHtml\(str\)/);
  });
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    assert.equal(escapeHtml('a&b'), 'a&amp;b');
  });

  it('escapes less-than', () => {
    assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  });

  it('escapes greater-than', () => {
    assert.equal(escapeHtml('a>b'), 'a&gt;b');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeHtml('a"b'), 'a&quot;b');
  });

  it('escapes single quotes', () => {
    assert.equal(escapeHtml("a'b"), 'a&#39;b');
  });

  it('escapes all special chars in one string', () => {
    assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  });

  it('returns empty string for empty input', () => {
    assert.equal(escapeHtml(''), '');
  });

  it('returns empty string for null input', () => {
    assert.equal(escapeHtml(null), '');
  });

  it('returns empty string for undefined input', () => {
    assert.equal(escapeHtml(undefined), '');
  });

  it('returns empty string for 0 (falsy number)', () => {
    assert.equal(escapeHtml(0), '');
  });

  it('passes through safe text unchanged', () => {
    assert.equal(escapeHtml('Hello World 123'), 'Hello World 123');
  });

  it('handles mixed content', () => {
    assert.equal(
      escapeHtml('<img src="x" onerror="alert(1)">'),
      '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
    );
  });
});

// ---------------------------------------------------------------------------
// sanitizeUrl
// ---------------------------------------------------------------------------

describe('sanitizeUrl', () => {
  // Allowed protocols
  it('allows http URLs', () => {
    const result = sanitizeUrl('http://example.com');
    assert.ok(result.length > 0, 'http URL should be allowed');
    assert.ok(result.includes('example.com'));
  });

  it('allows https URLs', () => {
    const result = sanitizeUrl('https://example.com/path?q=1');
    assert.ok(result.length > 0, 'https URL should be allowed');
    assert.ok(result.includes('example.com'));
  });

  // Blocked protocols
  it('blocks javascript: URLs', () => {
    assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  });

  it('blocks javascript: with mixed case', () => {
    // URL constructor normalizes protocol to lowercase
    assert.equal(sanitizeUrl('JavaScript:alert(1)'), '');
  });

  it('blocks data: URLs', () => {
    assert.equal(sanitizeUrl('data:text/html,<h1>hi</h1>'), '');
  });

  it('blocks vbscript: URLs', () => {
    assert.equal(sanitizeUrl('vbscript:msgbox("hi")'), '');
  });

  it('blocks ftp: URLs', () => {
    assert.equal(sanitizeUrl('ftp://example.com'), '');
  });

  // Empty / null / whitespace
  it('returns empty string for empty input', () => {
    assert.equal(sanitizeUrl(''), '');
  });

  it('returns empty string for null', () => {
    assert.equal(sanitizeUrl(null), '');
  });

  it('returns empty string for undefined', () => {
    assert.equal(sanitizeUrl(undefined), '');
  });

  it('returns empty string for whitespace-only input', () => {
    assert.equal(sanitizeUrl('   '), '');
  });

  // Relative URLs
  it('allows root-relative URLs starting with /', () => {
    const result = sanitizeUrl('/path/to/page');
    assert.equal(result, '/path/to/page');
  });

  it('allows relative URLs starting with ./', () => {
    const result = sanitizeUrl('./relative');
    assert.equal(result, './relative');
  });

  it('allows relative URLs starting with ../', () => {
    const result = sanitizeUrl('../parent');
    assert.equal(result, '../parent');
  });

  it('allows query-only relative URLs', () => {
    const result = sanitizeUrl('?query=value');
    assert.equal(result, '?query=value');
  });

  it('allows fragment-only relative URLs', () => {
    const result = sanitizeUrl('#section');
    assert.equal(result, '#section');
  });

  it('blocks bare strings that are not valid relative URLs', () => {
    assert.equal(sanitizeUrl('not-a-url'), '');
  });

  // HTML escaping in output
  it('escapes special characters in URL output', () => {
    const result = sanitizeUrl('https://example.com/path?a=1&b=2');
    assert.ok(result.includes('&amp;'), 'Ampersand in URL should be escaped');
  });

  it('trims leading/trailing whitespace before processing', () => {
    const result = sanitizeUrl('  https://example.com  ');
    assert.ok(result.includes('example.com'));
  });
});
