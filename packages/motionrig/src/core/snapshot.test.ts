import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configure,
  defaultsOf,
  rig,
  setValue,
  snapshot,
  subscribe,
} from './registry';
import { resetForTests } from '../test/reset';

const tick = () => new Promise<void>((r) => queueMicrotask(r));

beforeEach(() => {
  resetForTests();
  configure({ enabled: true });
});

const hero = () => ({ duration: 1.2, ease: 'power2.out', enter: { rows: 12, stagger: 0.05 } });

describe('subscribe / snapshot / defaultsOf', () => {
  it('snapshot is a frozen deep copy whose identity holds until the next change', () => {
    const v = rig('hero', hero());
    const s1 = snapshot(v);
    expect(s1).toEqual(v);
    expect(s1).not.toBe(v);
    expect(Object.isFrozen(s1.enter)).toBe(true);
    expect(snapshot(v)).toBe(s1);
    setValue('hero', 'enter.rows', 5);
    const s2 = snapshot(v);
    expect(s2).not.toBe(s1);
    expect(s2.enter.rows).toBe(5);
    expect(s1.enter.rows).toBe(12);
  });

  it('defaultsOf keeps the code defaults whatever the mutations', () => {
    const v = rig('hero', hero());
    setValue('hero', 'enter.rows', 5);
    setValue('hero', 'duration', 9);
    expect(defaultsOf(v)).toEqual(hero());
  });

  it('subscribe runs after the owning rig changes', async () => {
    const v = rig('hero', hero());
    const cb = vi.fn();
    subscribe(v, cb);
    setValue('hero', 'duration', 2);
    await tick();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('unknown objects: no-op subscribe, values returned as they are', () => {
    const loose = { x: 1 };
    expect(subscribe(loose, () => {})).toBeTypeOf('function');
    expect(snapshot(loose)).toBe(loose);
    expect(defaultsOf(loose)).toBe(loose);
  });

  it('gate closed: no-op subscribe, values returned as they are', async () => {
    resetForTests();
    const v = rig('hero', hero());
    const cb = vi.fn();
    subscribe(v, cb);
    setValue('hero', 'duration', 2);
    await tick();
    expect(cb).not.toHaveBeenCalled();
    expect(snapshot(v)).toBe(v);
    expect(defaultsOf(v)).toBe(v);
  });
});
