import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfig } from './config';
import { isEnabled } from './gate';
import { encodeShare } from './payload';
import { configure, rig, subscribe } from './registry';
import { resetForTests } from '../test/reset';
import { store } from './storage';

beforeEach(resetForTests);

const at = (url: string) => history.replaceState(null, '', url);
const flag = (key = 'motionrig') => sessionStorage.getItem(`${key}:on`);
/** Lets the gate's one-microtask commit (and the notify flush) run. */
const settle = () => new Promise<void>((r) => setTimeout(r, 0));
const seed = (key: string, overrides: object, baseline: object) =>
  localStorage.setItem(key, JSON.stringify({ v: 1, overrides, baseline, ui: {} }));
const saved = (key: string) => JSON.parse(localStorage.getItem(key) ?? 'null');
const where = () => location.pathname + location.search + location.hash;
const link = (duration: number, base = 1) =>
  encodeShare({ v: 1, o: { hero: { duration } }, b: { hero: { duration: base } } });

describe('gate (§7)', () => {
  it('is closed by default', () => {
    expect(isEnabled()).toBe(false);
  });

  it('enabled: false ⇒ closed, nothing read or written', async () => {
    sessionStorage.setItem('motionrig:on', '1');
    at(`/?rig=${link(2)}`);
    const read = vi.spyOn(Storage.prototype, 'getItem');
    setConfig({ enabled: false });
    expect(isEnabled()).toBe(false);
    await settle();
    expect(read).not.toHaveBeenCalled();
    expect(flag()).toBe('1');
    expect(where()).toBe(`/?rig=${link(2)}`);
  });

  it('enabled: true ⇒ open; a share payload is still imported and stripped, the sticky flag untouched', async () => {
    at(`/p?rig=${link(2)}#h`);
    setConfig({ enabled: true });
    expect(isEnabled()).toBe(true);
    await settle();
    expect(store().overrides).toEqual({ hero: { duration: 2 } });
    expect(where()).toBe('/p?rig#h');
    expect(flag()).toBeNull();
  });

  it('enabled: true ignores ?rig=off and the sticky flag', async () => {
    at('/?rig=off');
    setConfig({ enabled: true });
    expect(isEnabled()).toBe(true);
    await settle();
    expect(flag()).toBeNull();

    resetForTests();
    sessionStorage.setItem('motionrig:on', '1');
    at('/?rig=off');
    setConfig({ enabled: true });
    expect(isEnabled()).toBe(true);
    await settle();
    expect(flag()).toBe('1');
  });

  it('bare ?rig opens; the sticky flag is written in the next microtask, not during the read', async () => {
    at('/page?rig');
    expect(isEnabled()).toBe(true);
    expect(flag()).toBeNull();
    await settle();
    expect(flag()).toBe('1');
  });

  it('any other value opens and sets the sticky flag', async () => {
    at('/?rig=yes&x=1');
    expect(isEnabled()).toBe(true);
    await settle();
    expect(flag()).toBe('1');
  });

  it.each(['off', '0', 'false'])('?rig=%s closes and clears the sticky flag', async (v) => {
    sessionStorage.setItem('motionrig:on', '1');
    at(`/?rig=${v}`);
    expect(isEnabled()).toBe(false);
    await settle();
    expect(flag()).toBeNull();
  });

  it('the sticky flag keeps it open without the param', () => {
    sessionStorage.setItem('motionrig:on', '1');
    expect(isEnabled()).toBe(true);
  });

  it('honours config.param and config.storageKey', async () => {
    setConfig({ param: 'tune', storageKey: 'site' });
    at('/?rig');
    expect(isEnabled()).toBe(false);

    resetForTests();
    setConfig({ param: 'tune', storageKey: 'site' });
    at('/?tune');
    expect(isEnabled()).toBe(true);
    await settle();
    expect(flag('site')).toBe('1');
  });

  it('a share payload opens, sticks, is imported (after the read) and stripped from the URL', async () => {
    store().overrides = { hero: { duration: 9, delay: 1 } };
    store().baseline = { hero: { duration: 1, delay: 0 } };
    at(`/page?x=1&rig=${link(2, 1.5)}&y=2#hash`);

    expect(isEnabled()).toBe(true);
    expect(store().overrides.hero).toEqual({ duration: 9, delay: 1 });
    await settle();
    expect(flag()).toBe('1');
    expect(store().overrides).toEqual({ hero: { duration: 2, delay: 1 } });
    expect(store().baseline).toEqual({ hero: { duration: 1.5, delay: 0 } });
    expect(where()).toBe('/page?x=1&rig&y=2#hash');
  });

  it('an imported payload is applied to rigs already registered, and they are notified', async () => {
    at(`/?rig=${link(2)}`);
    const v = rig('hero', { duration: 1 });
    const cb = vi.fn();
    subscribe(v, cb);
    expect(v.duration).toBe(1);
    await settle();
    expect(v.duration).toBe(2);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('is computed once per page', () => {
    expect(isEnabled()).toBe(false);
    at('/?rig');
    expect(isEnabled()).toBe(false);
  });

  it('survives a sessionStorage that throws', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')!;
    Object.defineProperty(window, 'sessionStorage', {
      get: () => {
        throw new Error('SecurityError');
      },
      configurable: true,
    });
    try {
      at('/?rig');
      expect(isEnabled()).toBe(true);
      await settle();
    } finally {
      Object.defineProperty(window, 'sessionStorage', original);
    }
  });
});

describe('configure()', () => {
  it('re-evaluates the gate and applies stored overrides to rigs registered earlier', async () => {
    seed('motionrig', { hero: { duration: 2 } }, { hero: { duration: 1 } });
    const onChange = vi.fn();
    const v = rig('hero', { duration: 1 }, { onChange });
    expect(isEnabled()).toBe(false);
    expect(v.duration).toBe(1);

    configure({ enabled: true });
    expect(isEnabled()).toBe(true);
    expect(v.duration).toBe(2);
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);

    configure({ enabled: true });
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('closing an open gate restores every rig to its code defaults, nested, and clears css', async () => {
    seed('motionrig', { hero: { 'enter.rows': 3 }, faq: { gap: 9 } }, { hero: { 'enter.rows': 12 }, faq: { gap: 1 } });
    at('/?rig');
    const v = rig('hero', { enter: { rows: 12 } });
    rig('faq', { gap: 1 }, { css: true });
    const enter = v.enter;
    expect(enter.rows).toBe(3);
    expect(document.adoptedStyleSheets[0]?.cssRules[0]?.cssText).toContain('--gap');
    const cb = vi.fn();
    subscribe(v, cb);

    configure({ enabled: false });
    expect(isEnabled()).toBe(false);
    expect(v.enter).toBe(enter);
    expect(enter.rows).toBe(12);
    expect(document.adoptedStyleSheets[0]?.cssRules[0]?.cssText ?? '').not.toContain('--gap');
    await settle();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('order independence: a configure() later in the same tick decides the side effects', () => {
  it('enabled: false after rig() with ?rig=<payload>: nothing imported, stripped or made sticky', async () => {
    seed('motionrig', { hero: { duration: 5 } }, { hero: { duration: 1 } });
    at(`/?rig=${link(2)}`);
    const v = rig('hero', { duration: 1 });
    expect(v.duration).toBe(5);

    configure({ enabled: false });
    expect(v.duration).toBe(1);
    await settle();
    expect(v.duration).toBe(1);
    expect(saved('motionrig').overrides).toEqual({ hero: { duration: 5 } });
    expect(where()).toBe(`/?rig=${link(2)}`);
    expect(flag()).toBeNull();
  });

  it("param: 'tune' after rig() with ?rig: closed, restored, no sticky flag", async () => {
    seed('motionrig', { hero: { duration: 5 } }, { hero: { duration: 1 } });
    at('/?rig');
    const v = rig('hero', { duration: 1 });
    expect(v.duration).toBe(5);

    configure({ param: 'tune' });
    expect(isEnabled()).toBe(false);
    expect(v.duration).toBe(1);
    await settle();
    expect(flag()).toBeNull();
    expect(where()).toBe('/?rig');
  });

  it('storageKey change after rig() with ?rig=<payload>: restored, then the new key (with the payload) applies', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      seed('motionrig', { hero: { duration: 5, delay: 7 } }, { hero: { duration: 1, delay: 0 } });
      seed('site', { hero: { delay: 3 } }, { hero: { delay: 0 } });
      at(`/?rig=${link(2)}`);
      const v = rig('hero', { duration: 1, delay: 0 });
      expect(v).toEqual({ duration: 5, delay: 7 });

      configure({ storageKey: 'site' });
      expect(v).toEqual({ duration: 1, delay: 3 });
      await Promise.resolve();
      await Promise.resolve();
      expect(v).toEqual({ duration: 2, delay: 3 });
      expect(flag('site')).toBe('1');
      expect(flag()).toBeNull();
      expect(where()).toBe('/?rig');
      vi.advanceTimersByTime(250);
      expect(saved('site').overrides).toEqual({ hero: { delay: 3, duration: 2 } });
      expect(saved('motionrig').overrides).toEqual({ hero: { duration: 5, delay: 7 } });
    } finally {
      vi.useRealTimers();
    }
  });
});
