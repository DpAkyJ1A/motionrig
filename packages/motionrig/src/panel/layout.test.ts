import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure, rig } from '../index';
import { ui } from './ui';
import { $, clean, host, pointer } from '../test/panel';
import { mount, open } from './index';
import { css } from './styles';

const isOpen = (): boolean => host()!.hasAttribute('open');
const at = (el: HTMLElement): [string, string] => [el.style.getPropertyValue('--x'), el.style.getPropertyValue('--y')];

function viewport(width: number, height = 768): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
  window.dispatchEvent(new Event('resize'));
}

beforeEach(() => {
  clean();
  viewport(1024);
});

afterEach(() => {
  viewport(1024);
  vi.unstubAllGlobals();
});

describe('dragging', () => {
  it('the ring drags past a 3 px threshold, stays in the viewport and remembers its place', () => {
    configure({ enabled: true });
    mount();
    const ring = $('.ring')!;
    expect(at(ring)).toEqual(['16px', '712px']);
    pointer(ring, 'pointerdown', 30, 730);
    pointer(ring, 'pointermove', 32, 731);
    expect(at(ring)).toEqual(['16px', '712px']);
    pointer(ring, 'pointermove', -500, 900);
    pointer(ring, 'pointerup', -500, 900);
    expect(at(ring)).toEqual(['0px', '728px']);
    expect(ui().ring).toEqual({ x: 0, y: 728 });
    ring.click();
    expect(isOpen()).toBe(false);
    pointer(ring, 'pointerdown', 10, 740);
    pointer(ring, 'pointerup', 10, 740);
    ring.click();
    expect(isOpen()).toBe(true);
  });

  it('a second finger neither moves the ring nor ends its drag', () => {
    configure({ enabled: true });
    mount();
    const ring = $('.ring')!;
    pointer(ring, 'pointerdown', 30, 730, 1);
    pointer(ring, 'pointermove', 130, 630, 1);
    expect(at(ring)).toEqual(['116px', '612px']);
    pointer(ring, 'pointermove', 500, 100, 2);
    pointer(ring, 'pointerup', 500, 100, 2);
    expect(at(ring)).toEqual(['116px', '612px']);
    expect(ui().ring).toBeUndefined();
    pointer(ring, 'pointermove', 230, 530, 1);
    pointer(ring, 'pointerup', 230, 530, 1);
    expect(ui().ring).toEqual({ x: 216, y: 512 });
  });

  it('the grab point stays under the pointer anywhere, also while pressed (scale .94)', () => {
    configure({ enabled: true });
    mount();
    const ring = $('.ring')!;
    const rule = (sel: string): string => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.[\]()]/g, '\\$&')}\\{([^}]*)\\}`))![1]!.replace(/\n/g, '');
    // Placed by `translate` (outside `scale`), never by a `transform` that `scale` would shrink with it.
    for (const sel of ['.ring', '.panel']) {
      expect(rule(sel)).toMatch(/(^|;)translate:var\(--x,16px\) var\(--y,16px\)/);
      expect(rule(sel)).not.toMatch(/(^|;)transform:/);
    }
    const pressed = Number(rule('.ring:active').match(/scale:([\d.]+)/)![1]);
    // Where Chrome draws a point of the ring: translate + origin + scale × (point − origin), origin = its centre.
    const drawn = (local: number, offset: string): number => parseFloat(offset) + 20 + pressed * (local - 20);
    // Grab 7 px right / 9 px below the ring's top-left corner, drag to the far bottom-right corner (1024×768) and back.
    const [x0, y0] = at(ring).map(parseFloat) as [number, number];
    pointer(ring, 'pointerdown', x0 + 7, y0 + 9);
    const drift: number[][] = [];
    for (const [px, py] of [[991, 737], [600, 400], [980, 730]] as const) {
      pointer(ring, 'pointermove', px, py);
      const [x, y] = at(ring);
      expect([parseFloat(x) + 7, parseFloat(y) + 9]).toEqual([px, py]);
      drift.push([drawn(7, x) - px, drawn(9, y) - py]);
      // The centre is drawn exactly where the model puts it.
      expect([drawn(20, x), drawn(20, y)]).toEqual([parseFloat(x) + 20, parseFloat(y) + 20]);
    }
    // Only the press feedback's sub-pixel squeeze toward the centre, the same everywhere on screen.
    for (const d of drift) for (const [i, v] of d.entries()) expect(v).toBeCloseTo(drift[0]![i]!, 9);
    expect(Math.max(...drift.flat().map(Math.abs))).toBeLessThan(1);
    pointer(ring, 'pointerup', 980, 730);
    expect(ui().ring).toEqual({ x: 973, y: 721 });
  });

  it('the panel drags by its header (not from its fields) and remembers its place', () => {
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { panel: { x: 100, y: 100 } } }));
    configure({ enabled: true });
    open();
    const panel = $('.panel')!;
    const head = $('.head')!;
    expect(at(panel)).toEqual(['100px', '100px']);
    pointer($('.search input')!, 'pointerdown', 50, 50);
    pointer(head, 'pointermove', 150, 90);
    pointer(head, 'pointerup', 150, 90);
    expect(ui().panel).toEqual({ x: 100, y: 100 });
    pointer(head, 'pointerdown', 50, 50);
    pointer(head, 'pointermove', 150, 90);
    pointer(head, 'pointerup', 150, 90);
    expect(at(panel)).toEqual(['200px', '140px']);
    expect(ui().panel).toEqual({ x: 200, y: 140 });
  });

  it('by default sits bottom-left with a top that does not move between tabs of different height', () => {
    configure({ enabled: true });
    rig('short', { x: 1 });
    rig('tall', { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
    open('short');
    const panel = $('.panel')!;
    const heights: Record<string, number> = { short: 200, tall: 560 };
    Object.defineProperty(panel, 'offsetHeight', { get: () => heights[$('.chip[aria-pressed="true"]')!.dataset.id!], configurable: true });
    open('short');
    // 768 − min(80vh, 760) − 16, rounded
    const top = '138px';
    expect(at(panel)).toEqual(['16px', top]);
    $('.chip[data-id="tall"]')!.click();
    expect(at(panel)).toEqual(['16px', top]);
  });

  it('re-clamps when the open panel grows (ResizeObserver), and disconnects on removal', () => {
    const observers: { cb: () => void; targets: Element[]; off: boolean }[] = [];
    vi.stubGlobal('ResizeObserver', class {
      o: { cb: () => void; targets: Element[]; off: boolean };
      constructor(cb: () => void) {
        this.o = { cb, targets: [], off: false };
        observers.push(this.o);
      }
      observe(el: Element): void {
        this.o.targets.push(el);
      }
      disconnect(): void {
        this.o.off = true;
      }
    });
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { panel: { x: 100, y: 500 } } }));
    configure({ enabled: true });
    open();
    const panel = $('.panel')!;
    const ro = observers.find((o) => o.targets.includes(panel))!;
    expect(at(panel)).toEqual(['100px', '500px']);
    Object.defineProperty(panel, 'offsetHeight', { value: 400, configurable: true });
    ro.cb();
    expect(at(panel)).toEqual(['100px', '368px']);
    host()!.remove();
    expect(ro.off).toBe(true);
  });

  it('under 560 px the panel is a bottom sheet and does not drag', () => {
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { panel: { x: 100, y: 100 } } }));
    configure({ enabled: true });
    viewport(390, 844);
    open();
    const head = $('.head')!;
    pointer(head, 'pointerdown', 50, 50);
    pointer(head, 'pointermove', 150, 90);
    pointer(head, 'pointerup', 150, 90);
    expect(ui().panel).toEqual({ x: 100, y: 100 });
  });

  it('re-clamps on resize without forgetting the stored place', () => {
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { ring: { x: 900, y: 300 } } }));
    configure({ enabled: true });
    mount();
    const ring = $('.ring')!;
    expect(at(ring)).toEqual(['900px', '300px']);
    viewport(600);
    expect(at(ring)).toEqual(['560px', '300px']);
    viewport(1024);
    expect(at(ring)).toEqual(['900px', '300px']);
    expect(ui().ring).toEqual({ x: 900, y: 300 });
  });
});

describe('the panel keeps clear of the tab\'s target (§10.1)', () => {
  // 1440 × 900: the default panel (360 × 500) sits at x 16, top 900 − min(720, 760) − 16 = 164.
  const LEFT = ['16px', '164px'];
  const RIGHT = ['1064px', '164px'];

  function page(...boxes: Partial<DOMRect>[]): void {
    for (const box of boxes) {
      const el = document.body.appendChild(document.createElement('div'));
      el.className = 'target';
      const r = { left: 0, top: 0, width: 0, height: 0, ...box };
      el.getBoundingClientRect = () => ({ ...r, right: r.left + r.width, bottom: r.top + r.height }) as DOMRect;
    }
  }

  function setup(...boxes: Partial<DOMRect>[]): HTMLElement {
    viewport(1440, 900);
    configure({ enabled: true });
    rig('plain', { x: 1 });
    rig('hero', { x: 1 }, { target: '.target' });
    page(...boxes);
    mount();
    const panel = $('.panel')!;
    Object.defineProperty(panel, 'offsetWidth', { value: 360, configurable: true });
    Object.defineProperty(panel, 'offsetHeight', { value: 500, configurable: true });
    return panel;
  }

  it('open(id) moves the panel to the other side when it would cover the target', () => {
    const panel = setup({ left: 40, top: 300, width: 400, height: 200 });
    open('hero');
    expect(at(panel)).toEqual(RIGHT);
    // Not stored: the place the designer chose (or the default) stays home.
    expect(ui().panel).toBeUndefined();
  });

  it('stays put when the target is clear of it, and a target on the right sends it left', () => {
    const panel = setup({ left: 900, top: 100, width: 400, height: 200 });
    open('hero');
    expect(at(panel)).toEqual(LEFT);

    clean();
    localStorage.setItem('motionrig', JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: { panel: { x: 1000, y: 100 } } }));
    const again = setup({ left: 900, top: 100, width: 400, height: 200 });
    open('hero');
    expect(at(again)).toEqual(['16px', '100px']);
  });

  it('switching tabs moves it aside; a tab without a target leaves it where it is', () => {
    const panel = setup({ left: 40, top: 300, width: 400, height: 200 });
    open('plain');
    expect(at(panel)).toEqual(LEFT);
    $('.chip[data-id="hero"]')!.click();
    expect(at(panel)).toEqual(RIGHT);
    $('.chip[data-id="plain"]')!.click();
    expect(at(panel)).toEqual(RIGHT);
  });

  it('looks at the first visible match only: empty and off-screen ones are skipped', () => {
    const panel = setup({ left: 40, top: -600, width: 400, height: 200 }, { left: 40, top: 300, width: 0, height: 0 });
    open('hero');
    expect(at(panel)).toEqual(LEFT);
    page({ left: 40, top: 300, width: 400, height: 200 });
    $('.chip[data-id="plain"]')!.click();
    $('.chip[data-id="hero"]')!.click();
    expect(at(panel)).toEqual(RIGHT);
  });

  it('measures what is drawn: a block heading counts by its text, not the full-width line', () => {
    const panel = setup({ left: 40, top: 300, width: 1360, height: 100 });
    const text = { left: 40, top: 300, width: 520, height: 100, right: 560, bottom: 400 } as DOMRect;
    vi.spyOn(document, 'createRange').mockImplementation(() => {
      const range = new Range();
      range.getBoundingClientRect = () => text;
      return range;
    });
    open('hero');
    expect(at(panel)).toEqual(RIGHT);
  });

  it('keeps its side through a resize', () => {
    const panel = setup({ left: 40, top: 300, width: 400, height: 200 });
    open('hero');
    viewport(1200, 900);
    expect(at(panel)).toEqual(['824px', '164px']);
  });

  it('never fights a drag: once dragged this session, the panel stays where it was put', () => {
    const panel = setup({ left: 40, top: 300, width: 400, height: 200 });
    open('plain');
    const head = $('.head')!;
    pointer(head, 'pointerdown', 50, 200);
    pointer(head, 'pointermove', 60, 200);
    pointer(head, 'pointerup', 60, 200);
    expect(at(panel)).toEqual(['26px', '164px']);
    $('.chip[data-id="hero"]')!.click();
    expect(at(panel)).toEqual(['26px', '164px']);
  });

  it('a bottom sheet (under 560 px) is never moved', () => {
    const panel = setup({ left: 0, top: 500, width: 390, height: 200 });
    viewport(390, 844);
    open('hero');
    expect(at(panel)).toEqual(['', '']);
    expect(isOpen()).toBe(true);
  });
});
