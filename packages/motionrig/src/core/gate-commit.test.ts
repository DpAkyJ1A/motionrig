import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isEnabled } from './gate';
import { encodeShare } from './payload';
import { configure, onRegistryChange, rig, setValue } from './registry';
import { resetForTests } from '../test/reset';
import { store } from './storage';

beforeEach(resetForTests);

const at = (url: string) => history.replaceState(null, '', url);
const flag = (key = 'motionrig') => sessionStorage.getItem(`${key}:on`);
const settle = () => new Promise<void>((r) => setTimeout(r, 0));
const link = (duration: number, base = 1) =>
  encodeShare({ v: 1, o: { hero: { duration } }, b: { hero: { duration: base } } });

/** A reload in the same tab: pending writes flushed, module state gone, storage kept. */
function reload(url: string): void {
  dispatchEvent(new Event('pagehide'));
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('motionrig')];
  at(url);
}

describe('share payload import is idempotent per tab', () => {
  it('the same payload after a reload is not imported again, so later tweaks survive', async () => {
    at(`/?rig=${link(2)}`);
    const v = rig('hero', { duration: 1 });
    await settle();
    expect(v.duration).toBe(2);
    setValue('hero', 'duration', 3);

    // Next's App Router keeps writing the URL it captured, payload included.
    reload(`/?rig=${link(2)}`);
    const again = rig('hero', { duration: 1 });
    await settle();
    expect(again.duration).toBe(3);
  });

  it('a different payload is imported', async () => {
    at(`/?rig=${link(2)}`);
    rig('hero', { duration: 1 });
    await settle();
    setValue('hero', 'duration', 3);

    reload(`/?rig=${link(4)}`);
    const again = rig('hero', { duration: 1 });
    await settle();
    expect(again.duration).toBe(4);
  });

  it('remembers the imported value under <storageKey>:imported', async () => {
    at(`/?rig=${link(2)}`);
    rig('hero', { duration: 1 });
    configure({ storageKey: 'site' });
    await settle();
    expect(sessionStorage.getItem('site:imported')).toBe(link(2));
  });

  it('with sessionStorage blocked, imports every time', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'sessionStorage')!;
    Object.defineProperty(window, 'sessionStorage', {
      get: () => {
        throw new Error('SecurityError');
      },
      configurable: true,
    });
    try {
      at(`/?rig=${link(2)}`);
      rig('hero', { duration: 1 });
      await settle();
      setValue('hero', 'duration', 3);

      reload(`/?rig=${link(2)}`);
      const again = rig('hero', { duration: 1 });
      await settle();
      expect(again.duration).toBe(2);
    } finally {
      Object.defineProperty(window, 'sessionStorage', original);
    }
  });
});

describe('the import marker waits for the import to be stored', () => {
  const saved = () => JSON.parse(localStorage.getItem('motionrig') ?? '{}');

  it('stores the imported values right away, then marks the payload', async () => {
    at(`/?rig=${link(2)}`);
    rig('hero', { duration: 1 });
    await settle();
    expect(saved().overrides?.hero).toEqual({ duration: 2 });
    expect(sessionStorage.getItem('motionrig:imported')).toBe(link(2));
  });

  it('a refused localStorage write leaves no marker, so the next load imports again', async () => {
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    at(`/?rig=${link(2)}`);
    const v = rig('hero', { duration: 1 });
    await settle();
    expect(v.duration).toBe(2);
    expect(sessionStorage.getItem('motionrig:imported')).toBeNull();

    write.mockRestore();
    reload(`/?rig=${link(2)}`);
    const again = rig('hero', { duration: 1 });
    await settle();
    expect(again.duration).toBe(2);
    expect(sessionStorage.getItem('motionrig:imported')).toBe(link(2));
  });
});

describe('commit timing', () => {
  it('after configure(), the first computation commits synchronously: values are there before any effect', () => {
    at(`/p?rig=${link(2)}#h`);
    configure({});
    const v = rig('hero', { duration: 1 });
    expect(v.duration).toBe(2);
    expect(flag()).toBe('1');
    expect(location.pathname + location.search + location.hash).toBe('/p?rig#h');
  });

  it('without configure(), the commit waits one microtask', async () => {
    at(`/?rig=${link(2)}`);
    const v = rig('hero', { duration: 1 });
    expect(v.duration).toBe(1);
    expect(flag()).toBeNull();
    await Promise.resolve();
    expect(v.duration).toBe(2);
    expect(flag()).toBe('1');
  });
});

describe('registry listeners', () => {
  it('hear about a payload import in the commit (here nothing is registered, so nothing else notifies)', async () => {
    at(`/?rig=${link(2)}`);
    expect(isEnabled()).toBe(true);
    const cb = vi.fn();
    onRegistryChange(cb);
    await settle();
    expect(store().overrides.hero).toEqual({ duration: 2 });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('hear about a storageKey swap, even when no value changes', async () => {
    configure({ enabled: true });
    rig('hero', { duration: 1 });
    await settle();
    const cb = vi.fn();
    onRegistryChange(cb);
    configure({ storageKey: 'site' });
    await settle();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('side effects are committed once per page', () => {
  it('a later configure() does not write the sticky flag again', async () => {
    at('/?rig');
    rig('hero', { duration: 1 });
    await settle();
    expect(flag()).toBe('1');
    sessionStorage.removeItem('motionrig:on');
    configure({});
    await settle();
    expect(flag()).toBeNull();
  });
});

describe('payload strip survives a router that writes the served URL back', () => {
  afterEach(() => vi.useRealTimers());

  it('leaves a bare ?rig, keeps other params, the hash and custom state, minus Next\'s own marks', () => {
    history.replaceState({ mine: 1, __NA: true, _N: true }, '', `/page?a=1&rig=${link(2)}&b=2#top`);
    configure({});
    rig('hero', { duration: 1 });
    expect(location.pathname + location.search + location.hash).toBe('/page?a=1&rig&b=2#top');
    expect(history.state).toEqual({ mine: 1 });
  });

  it('re-strips when the URL is written back after import (Next hydration), for 10 s, without re-importing', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    at(`/?rig=${link(2)}#h`);
    configure({});
    const v = rig('hero', { duration: 1 });
    expect(v.duration).toBe(2);
    expect(location.search).toBe('?rig');
    setValue('hero', 'duration', 3);
    // The App Router hydrates with the URL it was served and replaces it back, with its own state.
    history.replaceState({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: {} }, '', `/?rig=${link(2)}#h`);
    vi.advanceTimersByTime(250);
    expect(location.search + location.hash).toBe('?rig#h');
    // Sent without __NA, so Next's patched replaceState would adopt it (and copy its marks back).
    expect(history.state).toEqual({ __PRIVATE_NEXTJS_INTERNALS_TREE: {} });
    expect(v.duration).toBe(3);
    // After 10 s the checks stop.
    vi.advanceTimersByTime(10_000);
    history.replaceState(null, '', `/?rig=${link(2)}`);
    vi.advanceTimersByTime(1000);
    expect(location.search).toBe(`?rig=${link(2)}`);
  });

  it('never touches a different param value (e.g. after navigating to another link)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    at(`/?rig=${link(2)}`);
    configure({});
    rig('hero', { duration: 1 });
    history.replaceState(null, '', `/other?rig=${link(4)}`);
    vi.advanceTimersByTime(500);
    expect(location.search).toBe(`?rig=${link(4)}`);
  });

  it('a strip that fails still leaves the import marked, so the payload is not imported twice', async () => {
    at(`/?rig=${link(2)}`);
    const replace = vi.spyOn(history, 'replaceState').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    configure({});
    rig('hero', { duration: 1 });
    replace.mockRestore();
    expect(location.search).toBe(`?rig=${link(2)}`);
    expect(sessionStorage.getItem('motionrig:imported')).toBe(link(2));
  });
});
