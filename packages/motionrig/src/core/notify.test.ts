import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configure,
  onRegistryChange,
  resetAll,
  rig,
  setValue,
  subscribeEntry,
} from './registry';
import { resetForTests } from '../test/reset';

const tick = () => new Promise<void>((r) => queueMicrotask(r));

beforeEach(() => {
  resetForTests();
  configure({ enabled: true });
});

const hero = () => ({ duration: 1.2, ease: 'power2.out', enter: { rows: 12, stagger: 0.05 } });

describe('notifications', () => {
  it('one notification per entry per tick, onChange batched with the live values', async () => {
    const onChange = vi.fn();
    const v = rig('hero', hero(), { onChange });
    const other = vi.fn();
    rig('other', { x: 1 });
    subscribeEntry('other', other);
    const cb = vi.fn();
    subscribeEntry('hero', cb);

    setValue('hero', 'duration', 2);
    setValue('hero', 'duration', 3);
    setValue('hero', 'enter.rows', 4);
    expect(cb).not.toHaveBeenCalled();
    await tick();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(v);
    expect(other).not.toHaveBeenCalled();
  });

  it('a throwing callback does not drop the others; its error is rethrown asynchronously', async () => {
    const errors: unknown[] = [];
    vi.stubGlobal('queueMicrotask', (cb: () => void) =>
      Promise.resolve().then(() => {
        try {
          cb();
        } catch (err) {
          errors.push(err);
        }
      }),
    );
    try {
      const boom = new Error('boom');
      const thrower = () => {
        throw boom;
      };
      rig('hero', hero(), { onChange: thrower });
      rig('other', { x: 1 });
      await new Promise((r) => setTimeout(r, 0));
      const after = vi.fn();
      const other = vi.fn();
      const registryAfter = vi.fn();
      subscribeEntry('hero', thrower);
      subscribeEntry('hero', after);
      subscribeEntry('other', other);
      onRegistryChange(thrower);
      onRegistryChange(registryAfter);

      setValue('hero', 'duration', 2);
      setValue('other', 'x', 2);
      rig('third', { y: 1 });
      await new Promise((r) => setTimeout(r, 0));
      expect([after, other, registryAfter].map((f) => f.mock.calls.length)).toEqual([1, 1, 1]);
      expect(errors).toEqual([boom, boom, boom]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('unsubscribes', async () => {
    rig('hero', hero());
    const cb = vi.fn();
    subscribeEntry('hero', cb)();
    setValue('hero', 'duration', 2);
    await tick();
    expect(cb).not.toHaveBeenCalled();
  });

  it('registry listeners hear about added / replaced entries and resets', async () => {
    const cb = vi.fn();
    onRegistryChange(cb);
    rig('a', { x: 1 });
    rig('b', { x: 1 });
    await tick();
    expect(cb).toHaveBeenCalledTimes(1);
    rig('a', { x: 1 });
    await tick();
    expect(cb).toHaveBeenCalledTimes(2);
    setValue('a', 'x', 2);
    await tick();
    expect(cb).toHaveBeenCalledTimes(2);
    resetAll();
    await tick();
    expect(cb).toHaveBeenCalledTimes(3);
  });
});
