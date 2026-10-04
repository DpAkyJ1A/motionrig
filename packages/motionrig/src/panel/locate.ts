import { h } from './dom';

let stop: (() => void) | undefined;

/**
 * Scrolls the first match of `selector` into view and rings up to 24 matches for 1.6 s.
 * The rings follow scrolling through rAF while they are visible. Returns whether anything matched.
 */
export function locate(selector: string, layer: HTMLElement): boolean {
  let els: Element[];
  try {
    els = [...document.querySelectorAll(selector)].slice(0, 24);
  } catch {
    return false;
  }
  if (!els.length) return false;
  stop?.();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  els[0]!.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  const rings = els.map(() => layer.appendChild(h('div', { class: 'locate', 'aria-hidden': 'true' })));
  let frame = 0;
  const place = (): void => {
    // All reads first, then all writes: no layout thrash per ring.
    const rects = els.map((el) => el.getBoundingClientRect());
    rects.forEach((r, i) => {
      const ring = rings[i]!.style;
      ring.setProperty('translate', `${r.left - 6}px ${r.top - 6}px`);
      ring.width = `${r.width + 12}px`;
      ring.height = `${r.height + 12}px`;
    });
    frame = requestAnimationFrame(place);
  };
  const timer = setTimeout(() => stop?.(), 1600);
  stop = () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    rings.forEach((r) => r.remove());
    stop = undefined;
  };
  place();
  return true;
}
