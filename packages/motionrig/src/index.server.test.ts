// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { entries } from './core/registry';
import { configure, defaultsOf, isEnabled, mountPanel, openPanel, rig, snapshot, subscribe } from './index';

vi.mock('./panel/index', () => ({ mount: vi.fn(), open: vi.fn() }));

describe('on the server (no window)', () => {
  it('rig() is an identity function and registers nothing', () => {
    const v = { duration: 1, enter: { rows: 2 } };
    configure({ enabled: true });
    expect(rig('hero', v)).toBe(v);
    expect(entries()).toEqual([]);
    expect(isEnabled()).toBe(false);
  });

  it('subscribe / snapshot / defaultsOf pass values through', () => {
    const v = rig('hero', { duration: 1 });
    expect(subscribe(v, () => {})).toBeTypeOf('function');
    expect(snapshot(v)).toBe(v);
    expect(defaultsOf(v)).toBe(v);
  });

  it('mountPanel / openPanel resolve without loading the panel', async () => {
    const panel = await import('./panel/index');
    await expect(mountPanel()).resolves.toBeUndefined();
    await expect(openPanel('hero')).resolves.toBeUndefined();
    expect(panel.mount).not.toHaveBeenCalled();
    expect(panel.open).not.toHaveBeenCalled();
  });
});
