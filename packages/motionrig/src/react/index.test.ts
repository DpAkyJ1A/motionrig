import { StrictMode, act, createElement, useEffect } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from 'motionrig';
import { setValue } from '../core/registry';
import { resetForTests } from '../test/reset';
import * as panel from '../panel/index';
import { RigPanel, useRig } from './index';

vi.mock('../panel/index', () => ({ mount: vi.fn(), open: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
beforeEach(() => {
  resetForTests();
  vi.mocked(panel.mount).mockClear();
  host = document.body.appendChild(document.createElement('div'));
});
afterEach(() => {
  host.remove();
});

const hero = () => ({ duration: 1, enter: { rows: 12 } });

describe('useRig', () => {
  it('re-renders only when its own rig changes, with a fresh immutable snapshot', async () => {
    configure({ enabled: true });
    const values = rig('hero', hero());
    rig('other', { x: 1 });
    const seen: { rows: number }[] = [];
    const Probe = () => {
      const v = useRig(values);
      seen.push(v.enter);
      return createElement('i', null, v.enter.rows);
    };
    const root = createRoot(host);
    await act(async () => root.render(createElement(Probe)));
    expect(seen).toHaveLength(1);

    await act(async () => setValue('other', 'x', 2));
    expect(seen).toHaveLength(1);

    await act(async () => {
      setValue('hero', 'enter.rows', 20);
      setValue('hero', 'duration', 3);
    });
    expect(seen).toHaveLength(2);
    expect(host.textContent).toBe('20');
    expect(seen[1]).not.toBe(seen[0]);
    expect(Object.isFrozen(seen[1])).toBe(true);
    await act(async () => root.unmount());
  });

  it('gives effects a dependency that changes when the designer tunes', async () => {
    configure({ enabled: true });
    const values = rig('hero', hero());
    const setups = vi.fn();
    const Anim = () => {
      const v = useRig(values);
      useEffect(() => setups(v.duration), [v]);
      return null;
    };
    const root = createRoot(host);
    await act(async () => root.render(createElement(Anim)));
    await act(async () => setValue('hero', 'duration', 2));
    expect(setups.mock.calls).toEqual([[1], [2]]);
    await act(async () => root.unmount());
  });

  it('gate closed: returns the values object itself', async () => {
    const values = rig('hero', hero());
    let got: unknown;
    const Probe = () => ((got = useRig(values)), null);
    const root = createRoot(host);
    await act(async () => root.render(createElement(Probe)));
    expect(got).toBe(values);
    await act(async () => root.unmount());
  });

  it('server snapshot is the code defaults, so hydration matches despite stored overrides', async () => {
    localStorage.setItem(
      'motionrig',
      JSON.stringify({ v: 1, overrides: { hero: { 'enter.rows': 20 } }, baseline: { hero: { 'enter.rows': 12 } }, ui: {} }),
    );
    configure({ enabled: true });
    const values = rig('hero', hero());
    expect(values.enter.rows).toBe(20);
    const View = () => createElement('b', null, useRig(values).enter.rows);

    const html = renderToString(createElement(View));
    expect(html).toBe('<b>12</b>');

    host.innerHTML = html;
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(host, createElement(View), { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(host.textContent).toBe('20');
    await act(async () => root!.unmount());
  });
});

describe('RigPanel', () => {
  it('mounts the panel once, after preload, and renders nothing', async () => {
    configure({ enabled: true });
    const preload = vi.fn(async () => {});
    const root = createRoot(host);
    await act(async () => root.render(createElement(StrictMode, null, createElement(RigPanel, { preload }))));
    await act(async () => root.render(createElement(StrictMode, null, createElement(RigPanel, { preload }))));
    expect(host.innerHTML).toBe('');
    expect(preload).toHaveBeenCalledTimes(1);
    expect(panel.mount).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
  });
});
