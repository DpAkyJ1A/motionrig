import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cssValue, cssVar, safeCss, syncCss } from './css';
import { configure, resetEntry, resetValue, rig, setValue } from './registry';
import { st } from './state';
import { resetForTests } from '../test/reset';
import { store } from './storage';
import type { Entry, RigMeta } from './types';

beforeEach(resetForTests);
afterEach(() => {
  vi.unstubAllGlobals();
});

/** Registers an entry directly, behind an open gate (syncCss writes nothing while closed). */
const entry = (id: string, values: object, meta: RigMeta<any>): Entry => {
  const e: Entry = { id, values, meta, version: 0 };
  st().gate = true;
  st().entries.set(id, e);
  return e;
};

const rootText = () => {
  const sheet = document.adoptedStyleSheets[0];
  return sheet ? [...sheet.cssRules].map((r) => r.cssText).join('') : undefined;
};

describe('variable naming and values', () => {
  it('kebab-cases the dotted path with an optional prefix', () => {
    const e = entry('a', {}, { css: true });
    expect(cssVar(e, 'fadeDuration')).toBe('--fade-duration');
    expect(cssVar(e, 'faq-duration')).toBe('--faq-duration');
    expect(cssVar(e, 'enter.rowGap')).toBe('--enter-row-gap');
    expect(cssVar(entry('b', {}, { css: { prefix: 'hero-' } }), 'x')).toBe('--hero-x');
  });

  it('appends the unit to numbers only', () => {
    const e = entry('a', {}, { css: true, controls: { d: { unit: 's' }, w: { unit: 'rem' }, h: false } });
    expect(cssValue(e, 'd', 0.7)).toBe('0.7s');
    expect(cssValue(e, 'w', 26)).toBe('26rem');
    expect(cssValue(e, 'n', 3)).toBe('3');
    expect(cssValue(e, 'h', 3)).toBe('3');
    expect(cssValue(e, 'ease', 'ease-out')).toBe('ease-out');
  });
});

describe('syncCss', () => {
  it('writes overridden leaves of css rigs to :root in one adopted stylesheet', () => {
    entry('faq', {}, { css: true, controls: { duration: { unit: 's' } } });
    entry('plain', {}, {});
    store().overrides = { faq: { duration: 0.9, ease: 'linear' }, plain: { x: 1 } };
    syncCss();
    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect(rootText()).toMatch(/^:root\s*\{\s*--duration:\s*0\.9s;\s*--ease:\s*linear;\s*\}$/);
    expect(document.documentElement.getAttribute('style')).toBeNull();
  });

  it('never writes anything while nothing is overridden', () => {
    entry('faq', {}, { css: true });
    syncCss();
    expect(document.adoptedStyleSheets).toHaveLength(0);
    expect(document.querySelector('style[data-motionrig]')).toBeNull();
  });

  it('removes a property once its override is gone, reusing the sheet', () => {
    entry('faq', {}, { css: true });
    store().overrides = { faq: { a: 1, b: 2 } };
    syncCss();
    delete store().overrides.faq!.a;
    syncCss();
    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect(rootText()).not.toContain('--a');
    expect(rootText()).toContain('--b');
  });

  it('skips string values that could break out of the declaration', () => {
    entry('faq', {}, { css: true });
    store().overrides = {
      faq: { ease: '0s}body{display:none}', a: 'x;color:red', d: 'a /* b', e: 'calc(1px', b: 'ease-out', c: 2 },
    };
    syncCss();
    expect(rootText()).not.toMatch(/body|display|color|--ease|--a|--d|--e/);
    expect(rootText()).toMatch(/--b:\s*ease-out;\s*--c:\s*2;/);
  });

  it('falls back to <style data-motionrig> without constructable stylesheets', () => {
    vi.stubGlobal('CSSStyleSheet', undefined);
    entry('faq', {}, { css: true, controls: { d: { unit: 'ms' } } });
    store().overrides = { faq: { d: 300 } };
    syncCss();
    const style = document.head.querySelector('style[data-motionrig]');
    expect(style?.textContent).toBe(':root{--d:300ms;}');
    store().overrides = {};
    syncCss();
    expect(style?.textContent).toBe(':root{}');
  });
});

describe('css rigs through the registry', () => {
  beforeEach(() => {
    configure({ enabled: true });
  });

  it('defaults are never written: a css rig without overrides leaves the page alone', () => {
    rig('faq', { duration: 0.7 }, { css: true, controls: { duration: { unit: 's' } } });
    expect(document.adoptedStyleSheets).toHaveLength(0);
  });

  it('stored overrides are written on rig(); setValue updates; reset removes', () => {
    localStorage.setItem(
      'motionrig',
      JSON.stringify({ v: 1, overrides: { faq: { duration: 0.9 } }, baseline: { faq: { duration: 0.7 } }, ui: {} }),
    );
    rig('faq', { duration: 0.7, fadeIn: 200 }, { css: true, controls: { duration: { unit: 's' }, fadeIn: { unit: 'ms' } } });
    expect(rootText()).toMatch(/--duration:\s*0\.9s/);

    setValue('faq', 'fadeIn', 300);
    expect(rootText()).toMatch(/--fade-in:\s*300ms/);

    resetValue('faq', 'duration');
    expect(rootText()).not.toContain('--duration');
    resetEntry('faq');
    expect(rootText()).not.toContain('--fade-in');
  });
});

describe('safeCss (shared with the CLI)', () => {
  it.each(['0.7s', 'ease-out', 'cubic-bezier(0.2, 0.8, 0.2, 1)', 'calc(100% - (2 * 4px))', '"a b"', "'it''s'", 'url("x\\"y")', 'a\\\\', 'linear(0, 0.5 50%, 1)', '[full-start] 1fr [full-end]', 'repeat(2, [a] 1fr)', '"a)" b', '"[" b'])(
    'accepts %s',
    (v) => expect(safeCss(v)).toBe(true),
  );

  it.each([
    ['semicolon', 'a;b'],
    ['semicolon inside quotes', '"a;b"'],
    ['brace', '0s}body{display:none}'],
    ['open brace', 'x{'],
    ['newline', 'a\nb'],
    ['carriage return', 'a\rb'],
    ['comment', 'ease /* x'],
    ['unbalanced (', 'cubic-bezier(0, 0, 1, 1'],
    ['unbalanced )', 'ease)'],
    ['unbalanced [', '[a 1fr'],
    ['stray ]', 'a]'],
    ['crossed ( ]', '(a]'],
    ['crossed [ )', '[a)'],
    ['closer before opener', ')('],
    ['unterminated "', '"abc'],
    ["unterminated '", "url('x)"],
    ['trailing backslash', 'abc\\'],
  ])('rejects %s', (_, v) => {
    expect(safeCss(v)).toBe(false);
  });

  it('numbers and booleans are always safe', () => {
    expect(safeCss(1.5)).toBe(true);
    expect(safeCss(false)).toBe(true);
  });
});
