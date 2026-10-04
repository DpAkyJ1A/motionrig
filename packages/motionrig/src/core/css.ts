import { st } from './state';
import { store } from './storage';
import type { Entry, Leaf } from './types';

export function cssVar(e: Entry, path: string): string {
  const { css } = e.meta;
  const prefix = typeof css === 'object' ? (css.prefix ?? '') : '';
  return `--${prefix}${path.replace(/\./g, '-').replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`;
}

export function cssValue(e: Entry, path: string, value: Leaf): string {
  const meta = e.meta.controls?.[path];
  return typeof value === 'number' && meta ? value + (meta.unit ?? '') : String(value);
}

/**
 * Whether a value can be written as a custom-property value (runtime) or a
 * `var()` fallback (CLI) without ending the declaration or rule, opening a
 * comment, or leaving a string, escape, parenthesis or bracket open. Stored and
 * shared values are untrusted, so anything else is skipped.
 */
export function safeCss(value: Leaf): boolean {
  if (typeof value !== 'string') return true;
  if (/[;{}\n\r\f]|\/\*/.test(value)) return false;
  // The closers still owed, innermost last.
  let owed = '';
  let quote = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]!;
    if (ch === '\\') {
      if (++i === value.length) return false;
    } else if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') owed += ')';
    else if (ch === '[') owed += ']';
    else if (ch === ')' || ch === ']') {
      if (!owed.endsWith(ch)) return false;
      owed = owed.slice(0, -1);
    }
  }
  return !quote && !owed;
}

/**
 * Mirrors overridden leaves of css rigs to `:root` custom properties. Defaults are
 * never written, so an untouched page renders exactly like production; the page's
 * own `var(--x, fallback)` shows again once an override is reset.
 */
export function syncCss(): void {
  const s = st();
  let text = '';
  // A closed gate shows production: no overrides, whatever storage holds.
  for (const e of s.gate ? s.entries.values() : []) {
    if (!e.meta.css) continue;
    for (const [path, value] of Object.entries(store().overrides[e.id] ?? {})) {
      if (!safeCss(value)) continue;
      text += `${cssVar(e, path)}:${cssValue(e, path, value)};`;
    }
  }
  if (text === (s.cssText ?? '')) return;
  s.cssText = text;
  let sheet = s.sheet;
  if (!sheet) {
    // Adopted sheets and a head <style> keep hydration safe: documentElement.style is never touched.
    try {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } catch {
      sheet = document.head.appendChild(document.createElement('style'));
      sheet.setAttribute('data-motionrig', '');
    }
    s.sheet = sheet;
  }
  const rule = `:root{${text}}`;
  if ('replaceSync' in sheet) sheet.replaceSync(rule);
  else sheet.textContent = rule;
}
