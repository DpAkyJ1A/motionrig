type Child = Node | string | false | null | undefined;
type Attr = string | number | boolean | null | undefined | ((e: any) => void);
export type Attrs = Record<string, Attr>;

const NS = 'http://www.w3.org/2000/svg';

/** `on*` attributes become listeners; everything else an attribute. Text goes in as text nodes, never HTML. */
function fill<E extends Element>(el: E, attrs: Attrs, children: Child[]): E {
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) el.setAttribute(k, v === true ? '' : String(v));
  }
  el.append(...(children.filter((c) => c || c === '') as (Node | string)[]));
  return el;
}

export const h = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] =>
  fill(document.createElement(tag), attrs, children);

export const s = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): SVGElementTagNameMap[K] =>
  fill(document.createElementNS(NS, tag), attrs, children);

/** The rig controller ring: accent circle, a notch at 12 o'clock, a centre dot. */
export const ringMark = (size: number): SVGSVGElement =>
  s('svg', { class: 'mark', viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' },
    s('g', { class: 'mark-turn' },
      s('circle', { cx: 12, cy: 12, r: 7.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }),
      // The notch sits on the outside of the ring, like a dial's index mark.
      s('path', { d: 'M12 1v3.5', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      s('circle', { cx: 12, cy: 12, r: 2, fill: 'currentColor' })));

const ICONS = {
  search: 'M7 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM10.3 10.3 14 14',
  link: 'M6.8 9.2a2.8 2.8 0 0 0 4 0l2.2-2.2a2.8 2.8 0 0 0-4-4L8 4M9.2 6.8a2.8 2.8 0 0 0-4 0L3 9a2.8 2.8 0 0 0 4 4l1-1',
  collapse: 'M3.5 8h9',
  reset: 'M3 8a5 5 0 1 0 1.5-3.5M3 2.5v2.8h2.8',
  reload: 'M13 8a5 5 0 1 1-1.5-3.5M13 2.5v2.8h-2.8',
  play: 'M5 3.2v9.6L12.8 8z',
  locate: 'M8 12.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM8 1v3M8 12v3M1 8h3M12 8h3',
  copy: 'M5.5 5.5h7v7h-7zM3.5 10.5v-7h7',
  chevron: 'M4.5 6.5 8 10l3.5-3.5',
} as const;

export const icon = (name: keyof typeof ICONS): SVGSVGElement =>
  s('svg', { class: `icon icon-${name}`, viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' },
    s('path', { d: ICONS[name] }));

/** Writes only a different value: an unchanged attribute costs no mutation (§10.7). */
export function attr(el: Element, name: string, value: string): void {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

/** `hidden`, written only when it differs. */
export function hide(el: HTMLElement, hidden: boolean): void {
  if (el.hidden !== hidden) el.hidden = hidden;
}

/** Text, written only when it differs. */
export function text(el: Node, value: string): void {
  if (el.textContent !== value) el.textContent = value;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), Math.max(lo, hi));
