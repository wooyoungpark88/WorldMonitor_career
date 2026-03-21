import { escapeHtml, sanitizeUrl } from './sanitize';

// Safe innerHTML setter that escapes all interpolated values
export function safeHTML(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => {
    const value = i < values.length ? escapeHtml(String(values[i] ?? '')) : '';
    return result + str + value;
  }, '');
}

// Create element with safe text content
export function createElement(tag: string, attrs?: Record<string, string>, textContent?: string): HTMLElement {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'href' || key === 'src') {
        el.setAttribute(key, sanitizeUrl(value));
      } else {
        el.setAttribute(key, value);
      }
    }
  }
  if (textContent !== undefined) {
    el.textContent = textContent;
  }
  return el;
}

// Safely set innerHTML with pre-escaped content
export function setInnerHTML(el: HTMLElement, html: string): void {
  el.innerHTML = html;
}
