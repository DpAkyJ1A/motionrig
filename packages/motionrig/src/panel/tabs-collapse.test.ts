import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { setValue } from '../core/registry';
import { flush } from '../core/storage';
import { ui } from './ui';
import { $, $$, clean, edit, tick } from '../test/panel';
import { open } from './index';
import { collapse, rowsOf } from './tabs';

/** A ResizeObserver the test drives: `resize()` reports every observed box, a hidden one as 0 (like display:none). */
const observers: { cb: ResizeObserverCallback; targets: Set<Element> }[] = [];
class FakeObserver {
  private o: { cb: ResizeObserverCallback; targets: Set<Element> };
  constructor(cb: ResizeObserverCallback) {
    this.o = { cb, targets: new Set() };
    observers.push(this.o);
  }
  observe(el: Element) {
    this.o.targets.add(el);
  }
  unobserve(el: Element) {
    this.o.targets.delete(el);
  }
  disconnect() {
    this.o.targets.clear();
  }
}
const AVAIL = 336;
const CHIP = 60;
function resize(): void {
  for (const o of observers) {
    const entries = [...o.targets].map((target) => {
      const w = (target as HTMLElement).hidden ? 0 : target.classList.contains('tabs') ? AVAIL : target.classList.contains('more-tabs') ? 40 : CHIP;
      return { target, borderBoxSize: [{ inlineSize: w }], contentBoxSize: [{ inlineSize: w }] };
    });
    if (entries.length) o.cb(entries as unknown as ResizeObserverEntry[], o as unknown as ResizeObserver);
  }
}

const shown = (): string[] => $$('.chip:not([hidden])').map((c) => c.dataset.id!);
const toggle = (): HTMLButtonElement => $<HTMLButtonElement>('.more-tabs')!;

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', FakeObserver);
  clean();
  configure({ enabled: true });
  for (let i = 0; i < 20; i++) rig(`r${i}`, { x: 1 });
});
afterEach(() => vi.unstubAllGlobals());

describe('row packing', () => {
  it('wraps like flex-wrap with a 6 px gap', () => {
    expect(rowsOf([60, 60, 60, 60, 60], 336)).toBe(1); // 5×60 + 4×6 = 324
    expect(rowsOf([60, 60, 60, 60, 60, 60], 336)).toBe(2);
    expect(rowsOf([], 336)).toBe(0);
  });

  it('keeps pinned ids, then fills in order while the "+N" chip still fits in two rows', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `r${i}`);
    const keep = collapse(ids, () => 60, (id) => id === 'r17', 336, 48);
    expect([...keep].sort()).toEqual(['r0', 'r1', 'r17', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].sort());
  });
});

describe('tab strip collapse (§10.3)', () => {
  it('shows two rows ending in "+N"; "+N" expands to all, "Less" collapses, and the choice is stored', () => {
    open('r0');
    resize();
    expect(shown()).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8']);
    expect([toggle().hidden, toggle().textContent, toggle().getAttribute('aria-label'), toggle().getAttribute('aria-expanded')])
      .toEqual([false, '+11', '11 more', 'false']);
    // After the chips: "+N", then "mark seen", then the "no match" line.
    expect(toggle().previousElementSibling).toBe($('.chip[data-id="r19"]'));
    expect(toggle().nextElementSibling!.classList.contains('seen-all')).toBe(true);

    toggle().click();
    resize();
    expect(shown()).toHaveLength(20);
    expect([toggle().textContent, toggle().getAttribute('aria-expanded')]).toEqual(['Less', 'true']);
    expect(ui().allTabs).toBe(true);
    flush();
    expect(JSON.parse(localStorage.getItem('motionrig')!).ui.allTabs).toBe(true);

    toggle().click();
    expect(shown()).toHaveLength(9);
    expect(ui().allTabs).toBe(false);
  });

  it('a stored expanded strip opens expanded', () => {
    clean();
    vi.stubGlobal('ResizeObserver', FakeObserver);
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { allTabs: true } }));
    configure({ enabled: true });
    for (let i = 0; i < 20; i++) rig(`r${i}`, { x: 1 });
    open('r0');
    resize();
    expect(shown()).toHaveLength(20);
    expect(toggle().textContent).toBe('Less');
  });

  it('expanded, "Less" is there only while the tabs take more than the two collapsed rows', async () => {
    clean();
    vi.stubGlobal('ResizeObserver', FakeObserver);
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { allTabs: true } }));
    configure({ enabled: true });
    // Five 60 px chips to a 336 px row: ten fill exactly two rows.
    for (let i = 0; i < 10; i++) rig(`r${i}`, { x: 1 });
    open('r0');
    resize();
    expect(shown()).toHaveLength(10);
    expect([toggle().hidden, $('.tabs')!.classList.contains('all')]).toEqual([true, false]);
    rig('r10', { x: 1 });
    await tick();
    resize();
    expect(shown()).toHaveLength(11);
    expect([toggle().hidden, toggle().textContent, $('.tabs')!.classList.contains('all')]).toEqual([false, 'Less', true]);
  });

  it('pins the active tab and tabs with overrides into the visible rows', async () => {
    setValue('r12', 'x', 2);
    open('r15');
    resize();
    expect(shown()).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r12', 'r15']);
    expect(toggle().textContent).toBe('+11');
    // A new override pins its tab as soon as its dot shows.
    setValue('r18', 'x', 2);
    await tick();
    resize();
    expect(shown()).toContain('r18');
    expect(shown()).toHaveLength(9);
    // Picking a hidden tab (e.g. via the expanded list) keeps it visible once collapsed.
    $<HTMLButtonElement>('.chip[data-id="r19"]')!.click();
    expect(shown()).toContain('r19');
  });

  it('search filters across all tabs and shows every match, no toggle; clearing it collapses again', () => {
    for (let i = 0; i < 12; i++) rig(`match${i}`, { y: 1 });
    open('r0');
    resize();
    edit($<HTMLInputElement>('.search input')!, 'match');
    expect(shown()).toHaveLength(12);
    expect(toggle().hidden).toBe(true);
    edit($<HTMLInputElement>('.search input')!, '');
    expect(shown()).toHaveLength(9);
    expect(toggle().hidden).toBe(false);
  });

  it('few tabs: no toggle', () => {
    clean();
    vi.stubGlobal('ResizeObserver', FakeObserver);
    configure({ enabled: true });
    rig('a', { x: 1 });
    rig('b', { x: 1 });
    open('a');
    resize();
    expect(shown()).toEqual(['a', 'b']);
    expect(toggle().hidden).toBe(true);
  });

  it('reads no layout while values change: sizes come from the observer only', async () => {
    open('r0');
    resize();
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get');
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    for (let v = 2; v < 12; v++) setValue('r0', 'x', v);
    await tick();
    expect(width).not.toHaveBeenCalled();
    expect(rect).not.toHaveBeenCalled();
    width.mockRestore();
    rect.mockRestore();
  });
});
