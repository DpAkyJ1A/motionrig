import { draggable, fit } from './drag';
import type { Point } from './drag';
import { setUi, ui } from './ui';

const RING = 40;
const INSET = 16;
/** Under this viewport width the panel is a bottom sheet. */
const SHEET = 560;

export interface Layout {
  /** Default: bottom-left. Display positions are clamped; stored ones are kept. */
  ring(): void;
  panel(): void;
  /** Makes a freshly built header the panel's drag handle. */
  head(head: HTMLElement): void;
  /** Moves the panel to the far side when it covers the first visible match of `target`. */
  clear(target: string | undefined): void;
}

const place = (el: HTMLElement, p: Point): void => {
  el.style.setProperty('--x', `${p.x}px`);
  el.style.setProperty('--y', `${p.y}px`);
};

/** What is drawn: a block heading's text, not the full-width line it sits on; an empty box falls back to the element's. */
function drawn(el: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  return r.width && r.height ? r : el.getBoundingClientRect();
}

function firstVisible(selector: string): DOMRect | undefined {
  let els: NodeListOf<Element>;
  try {
    els = document.querySelectorAll(selector);
  } catch {
    return undefined;
  }
  for (const el of els) {
    const r = drawn(el);
    if (r.width && r.height && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth) return r;
  }
  return undefined;
}

/** Positions of the ring and the panel: drags, defaults, clamping, and keeping clear of a target. */
export function layout(ring: HTMLElement, panel: HTMLElement, tap: () => void): Layout {
  let ringAt: Point = { x: 0, y: 0 };
  let panelAt: Point = { x: 0, y: 0 };
  /** Set while the panel keeps clear of a target; never stored, so home stays the designer's. */
  let side: 'left' | 'right' | undefined;
  /** Dragged by the designer this session: its place is theirs from then on. */
  let moved = false;
  /** Set by a ring drag so the click that ends it doesn't open the panel. */
  let dragged = false;

  ring.addEventListener('pointerdown', () => (dragged = false));
  ring.addEventListener('click', () => {
    if (dragged) dragged = false;
    else tap();
  });
  draggable({
    handle: ring,
    start: () => ({ at: ringAt, w: RING, h: RING }),
    move: (p) => place(ring, (ringAt = p)),
    end: (p) => {
      dragged = true;
      setUi({ ring: p });
    },
  });

  /**
   * Default: bottom-left, as if at full height (max-height), so the header stays put when
   * tabs of different heights are picked. A bottom sheet is laid out by CSS alone.
   */
  const placePanel = (): void => {
    if (innerWidth < SHEET) return;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const home = ui().panel ?? { x: INSET, y: Math.round(innerHeight - Math.min(innerHeight * 0.8, 760) - INSET) };
    const x = side === 'left' ? INSET : side === 'right' ? innerWidth - w - INSET : home.x;
    place(panel, (panelAt = fit({ x, y: home.y }, w, h)));
  };

  return {
    ring: () => place(ring, (ringAt = fit(ui().ring ?? { x: INSET, y: innerHeight - RING - INSET }, RING, RING))),
    panel: placePanel,
    head: (head) =>
      void draggable({
        handle: head,
        start: (e) => {
          const from = e.composedPath()[0] as Element;
          if (innerWidth < SHEET || from.closest('input, button, label, select')) return undefined;
          return { at: panelAt, w: panel.offsetWidth, h: panel.offsetHeight };
        },
        move: (p) => {
          moved = true;
          side = undefined;
          place(panel, (panelAt = p));
        },
        end: (p) => setUi({ panel: p }),
      }),
    clear(target) {
      if (moved || !target || innerWidth < SHEET) return;
      const r = firstVisible(target);
      const { x, y } = panelAt;
      if (!r || r.right <= x || r.left >= x + panel.offsetWidth || r.bottom <= y || r.top >= y + panel.offsetHeight) return;
      side = r.left + r.width / 2 < innerWidth / 2 ? 'right' : 'left';
      placePanel();
    },
  };
}
