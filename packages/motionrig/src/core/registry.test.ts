import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changedCount,
  configure,
  defaultsOf,
  entries,
  getEntry,
  onRegistryChange,
  overridesOf,
  resetAll,
  resetEntry,
  resetValue,
  rig,
  setValue,
} from './registry';
import { controlsOf } from './infer';
import { resetForTests } from '../test/reset';
import { store } from './storage';

const tick = () => new Promise<void>((r) => queueMicrotask(r));

beforeEach(() => {
  resetForTests();
  configure({ enabled: true });
});

const hero = () => ({ duration: 1.2, ease: 'power2.out', enter: { rows: 12, stagger: 0.05 } });

describe('rig()', () => {
  it('returns the very object it was given', () => {
    const v = hero();
    expect(rig('hero', v)).toBe(v);
  });

  it('registers entries in registration order', () => {
    const a = rig('a', { x: 1 });
    rig('b', { y: 1 });
    expect(entries().map((e) => e.id)).toEqual(['a', 'b']);
    expect(getEntry('a')?.values).toBe(a);
  });

  it('with the gate closed registers without localStorage, clone or DOM work', () => {
    resetForTests();
    localStorage.setItem(
      'motionrig',
      JSON.stringify({ v: 1, overrides: { a: { x: 2 } }, baseline: { a: { x: 1 } }, ui: {} }),
    );
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const v = rig('a', { x: 1 }, { css: true });
    expect(getEntry('a')?.values).toBe(v);
    expect(v.x).toBe(1);
    expect(getItem.mock.calls.filter(([k]) => k === 'motionrig')).toEqual([]);
    expect(getEntry('a')!.defaults).toBeUndefined();
    expect(document.adoptedStyleSheets).toHaveLength(0);
    expect(document.querySelector('style[data-motionrig]')).toBeNull();
  });

  it('re-registering the same object takes the new meta, drops cached controls and tells the registry', async () => {
    const v = rig('hero', hero(), { title: 'Old' });
    const e = getEntry('hero')!;
    expect(controlsOf(e)[0]!.controls[0]!.label).toBe('duration');
    const cb = vi.fn();
    await tick();
    onRegistryChange(cb);

    rig('hero', v, { title: 'New', controls: { duration: { label: 'Duration' } } });
    expect(getEntry('hero')!.meta.title).toBe('New');
    expect(controlsOf(getEntry('hero')!)[0]!.controls[0]!.label).toBe('Duration');
    await tick();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('re-registering the same object keeps its overrides', () => {
    const v = rig('hero', hero());
    setValue('hero', 'duration', 2);
    expect(rig('hero', v)).toBe(v);
    expect(v.duration).toBe(2);
    expect(overridesOf('hero')).toEqual({ duration: 2 });
  });
});

describe('setValue', () => {
  it('mutates nested values in place, keeping nested references live', () => {
    const v = rig('hero', hero());
    const enter = v.enter;
    setValue('hero', 'enter.rows', 20);
    expect(enter.rows).toBe(20);
    expect(v.enter).toBe(enter);
  });

  it('stores the override with its baseline and bumps the version', () => {
    rig('hero', hero());
    setValue('hero', 'duration', 2);
    expect(getEntry('hero')?.version).toBe(1);
    expect(store().overrides.hero).toEqual({ duration: 2 });
    expect(store().baseline.hero).toEqual({ duration: 1.2 });
  });

  it('removes the override when set back to the default', () => {
    rig('hero', hero());
    setValue('hero', 'duration', 2);
    setValue('hero', 'duration', 1.2);
    expect(overridesOf('hero')).toEqual({});
    expect(store().overrides).toEqual({});
    expect(store().baseline).toEqual({});
  });

  it('ignores a value whose type differs from the default', () => {
    const v = rig('hero', hero());
    setValue('hero', 'duration', '2');
    setValue('hero', 'ease', 3);
    expect(v).toEqual(hero());
    expect(store().overrides).toEqual({});
  });

  it('ignores unknown ids, unknown paths and object paths', () => {
    const v = rig('hero', hero());
    setValue('nope', 'duration', 2);
    setValue('hero', 'missing', 2);
    setValue('hero', 'enter', 2);
    expect(v).toEqual(hero());
    expect(store().overrides).toEqual({});
  });
});

describe('resets and counts', () => {
  it('resetValue restores one default', () => {
    const v = rig('hero', hero());
    setValue('hero', 'duration', 2);
    setValue('hero', 'enter.rows', 3);
    resetValue('hero', 'enter.rows');
    expect(v.enter.rows).toBe(12);
    expect(overridesOf('hero')).toEqual({ duration: 2 });
  });

  it('resetEntry restores every default of a rig', () => {
    const v = rig('hero', hero());
    setValue('hero', 'duration', 2);
    setValue('hero', 'enter.rows', 3);
    resetEntry('hero');
    expect(v).toEqual(hero());
    expect(store().overrides).toEqual({});
  });

  it('resetAll clears every rig, including stored ids not on this page', () => {
    store().overrides.elsewhere = { x: 1 };
    store().baseline.elsewhere = { x: 0 };
    const v = rig('hero', hero());
    setValue('hero', 'duration', 2);
    expect(changedCount()).toBe(2);
    resetAll();
    expect(v).toEqual(hero());
    expect(changedCount()).toBe(0);
    expect(store()).toMatchObject({ overrides: {}, baseline: {} });
  });
});

describe('HMR re-register', () => {
  it('replaces the entry in place and re-applies overrides to the new object', async () => {
    rig('first', { x: 1 });
    rig('hero', hero());
    setValue('hero', 'duration', 2);
    setValue('hero', 'enter.rows', 7);
    const cb = vi.fn();
    onRegistryChange(cb);

    const next = rig('hero', hero());
    expect(next.duration).toBe(2);
    expect(next.enter.rows).toBe(7);
    expect(defaultsOf(next)).toEqual(hero());
    expect(entries().map((e) => e.id)).toEqual(['first', 'hero']);
    expect(getEntry('hero')?.values).toBe(next);
    await tick();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
