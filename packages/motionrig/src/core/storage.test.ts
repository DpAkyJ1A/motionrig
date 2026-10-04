import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfig } from './config';
import { configure, rig, setValue } from './registry';
import { resetForTests } from '../test/reset';
import { flush, importShare, persist, store } from './storage';

beforeEach(resetForTests);
afterEach(() => {
  vi.useRealTimers();
});

const saved = (key = 'motionrig') => JSON.parse(localStorage.getItem(key) ?? 'null');

describe('load', () => {
  it('starts empty when nothing is stored', () => {
    expect(store()).toEqual({ v: 1, overrides: {}, baseline: {}, ui: {} });
  });

  it('loads stored overrides, baseline and ui, dropping invalid leaves', () => {
    localStorage.setItem(
      'motionrig',
      JSON.stringify({
        v: 1,
        overrides: { hero: { duration: 2, bad: { x: 1 } } },
        baseline: { hero: { duration: 1 } },
        ui: { open: true, tab: 'hero' },
      }),
    );
    expect(store()).toEqual({
      v: 1,
      overrides: { hero: { duration: 2 } },
      baseline: { hero: { duration: 1 } },
      ui: { open: true, tab: 'hero' },
    });
  });

  it('keeps the ui object as stored (the panel checks it), and nothing but an object', () => {
    const raw = { open: 'yes', extra: 1 };
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: raw }));
    expect(store().ui).toEqual(raw);
    resetForTests();
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: [1] }));
    expect(store().ui).toEqual({});
  });

  it.each(['{not json', '[1,2]', '{"v":2,"overrides":{"a":{"b":1}}}', 'null'])(
    'corrupt or foreign JSON %j starts empty',
    (raw) => {
      localStorage.setItem('motionrig', raw);
      expect(store()).toEqual({ v: 1, overrides: {}, baseline: {}, ui: {} });
    },
  );

  it('uses config.storageKey and reloads when it changes', () => {
    localStorage.setItem('site', JSON.stringify({ v: 1, overrides: { a: { x: 1 } }, baseline: { a: { x: 0 } }, ui: {} }));
    expect(store().overrides).toEqual({});
    setConfig({ storageKey: 'site' });
    expect(store().overrides).toEqual({ a: { x: 1 } });
  });
});

describe('storage that throws', () => {
  it('works in memory and never throws', () => {
    const throwing = { get: () => { throw new Error('SecurityError'); }, configurable: true };
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', throwing);
    try {
      expect(() => localStorage).toThrow('SecurityError');
      store().overrides.hero = { duration: 2 };
      persist();
      expect(() => flush()).not.toThrow();
      expect(store().overrides.hero).toEqual({ duration: 2 });
    } finally {
      Object.defineProperty(window, 'localStorage', original);
    }
  });
});

describe('persist', () => {
  it('debounces writes by 250 ms', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    store().overrides.a = { x: 1 };
    persist();
    vi.advanceTimersByTime(200);
    persist();
    vi.advanceTimersByTime(200);
    expect(localStorage.getItem('motionrig')).toBeNull();
    vi.advanceTimersByTime(50);
    expect(saved().overrides).toEqual({ a: { x: 1 } });
  });

  it('flushes a pending write on pagehide', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    store().overrides.a = { x: 1 };
    persist();
    window.dispatchEvent(new Event('pagehide'));
    expect(saved().overrides).toEqual({ a: { x: 1 } });
  });

  it('flushes a pending write when the tab is hidden, not while it stays visible', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let hidden = false;
    const spy = vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    try {
      store().overrides.a = { x: 1 };
      persist();
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
      expect(localStorage.getItem('motionrig')).toBeNull();
      hidden = true;
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
      expect(saved().overrides).toEqual({ a: { x: 1 } });
    } finally {
      spy.mockRestore();
    }
  });

  it('writes nothing on flush when nothing is pending', () => {
    store();
    flush();
    expect(localStorage.getItem('motionrig')).toBeNull();
  });
});

describe('importShare', () => {
  it('replaces stored overrides for the listed paths with payload baselines, keeping the rest', () => {
    const s = store();
    s.overrides = { hero: { duration: 2, delay: 1 }, other: { x: 5 } };
    s.baseline = { hero: { duration: 1, delay: 0 }, other: { x: 4 } };
    importShare({
      v: 1,
      o: { hero: { duration: 3 }, fresh: { y: 'a', orphan: 1 } },
      b: { hero: { duration: 1.5 }, fresh: { y: 'b' } },
    });
    expect(store().overrides).toEqual({ hero: { duration: 3, delay: 1 }, other: { x: 5 }, fresh: { y: 'a' } });
    expect(store().baseline).toEqual({ hero: { duration: 1.5, delay: 0 }, other: { x: 4 }, fresh: { y: 'b' } });
  });
});

describe('baseline guard ("code wins") on rig()', () => {
  const seed = (overrides: object, baseline: object) =>
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides, baseline, ui: {} }));

  beforeEach(() => {
    configure({ enabled: true });
  });

  it('applies an override whose baseline matches the code default', () => {
    seed({ hero: { duration: 2, 'enter.rows': 3 } }, { hero: { duration: 1, 'enter.rows': 12 } });
    const v = rig('hero', { duration: 1, enter: { rows: 12 } });
    expect(v).toEqual({ duration: 2, enter: { rows: 3 } });
  });

  it('drops (and persists the drop of) overrides tuned against another default', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    seed({ hero: { duration: 2, delay: 5, gone: 1 } }, { hero: { duration: 0.8, delay: 0 } });
    const v = rig('hero', { duration: 1, delay: 0 });
    expect(v).toEqual({ duration: 1, delay: 5 });
    vi.advanceTimersByTime(250);
    expect(saved().overrides).toEqual({ hero: { delay: 5 } });
    expect(saved().baseline).toEqual({ hero: { delay: 0 } });
  });

  it('drops an override whose type differs from the default (untrusted input)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    seed({ hero: { duration: '2', on: 1, label: 'ok' } }, { hero: { duration: 1, on: true, label: 'x' } });
    const v = rig('hero', { duration: 1, on: true, label: 'x' });
    expect(v).toEqual({ duration: 1, on: true, label: 'ok' });
    vi.advanceTimersByTime(250);
    expect(saved().overrides).toEqual({ hero: { label: 'ok' } });
  });

  it('keeps overrides of ids not registered on this page', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    seed({ hero: { duration: 2 }, other: { x: 9 } }, { hero: { duration: 0 }, other: { x: 1 } });
    rig('hero', { duration: 1 });
    vi.advanceTimersByTime(250);
    expect(saved().overrides).toEqual({ other: { x: 9 } });
    expect(saved().baseline).toEqual({ other: { x: 1 } });
  });

  it('persists setValue through the debounce', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    rig('hero', { duration: 1 });
    setValue('hero', 'duration', 3);
    vi.advanceTimersByTime(250);
    expect(saved()).toMatchObject({ overrides: { hero: { duration: 3 } }, baseline: { hero: { duration: 1 } } });
  });
});
