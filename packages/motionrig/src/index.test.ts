import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from './index';
import { resetForTests } from './test/reset';
import * as panel from './panel/index';

vi.mock('./panel/index', () => ({ mount: vi.fn(), open: vi.fn() }));

beforeEach(() => {
  resetForTests();
  vi.mocked(panel.mount).mockClear();
  vi.mocked(panel.open).mockClear();
});

describe('public API (§3)', () => {
  it('exports exactly the documented functions', () => {
    expect(Object.keys(api).sort()).toEqual(
      ['configure', 'defaultsOf', 'isEnabled', 'mountPanel', 'openPanel', 'rig', 'snapshot', 'subscribe'].sort(),
    );
  });
});

describe('mountPanel', () => {
  it('gate closed: resolves without loading the panel', async () => {
    await api.mountPanel();
    expect(panel.mount).not.toHaveBeenCalled();
  });

  it('awaits preload, then mounts the panel once however often it is called', async () => {
    api.configure({ enabled: true });
    const order: string[] = [];
    vi.mocked(panel.mount).mockImplementation(() => void order.push('mount'));
    const preload = vi.fn(async () => {
      await Promise.resolve();
      api.rig('lazy', { x: 1 });
      order.push('preload');
    });
    await Promise.all([api.mountPanel({ preload }), api.mountPanel({ preload })]);
    await api.mountPanel();
    expect(order).toEqual(['preload', 'mount']);
    expect(preload).toHaveBeenCalledTimes(1);
  });

  it('can be retried after a failed preload', async () => {
    api.configure({ enabled: true });
    await expect(api.mountPanel({ preload: () => Promise.reject(new Error('offline')) })).rejects.toThrow('offline');
    await api.mountPanel();
    expect(panel.mount).toHaveBeenCalledTimes(1);
  });
});

describe('openPanel', () => {
  it('mounts, then opens the requested tab', async () => {
    api.configure({ enabled: true });
    await api.openPanel('hero');
    expect(panel.mount).toHaveBeenCalledTimes(1);
    expect(panel.open).toHaveBeenCalledWith('hero');
  });

  it('gate closed: no-op', async () => {
    await api.openPanel('hero');
    expect(panel.mount).not.toHaveBeenCalled();
    expect(panel.open).not.toHaveBeenCalled();
  });
});
