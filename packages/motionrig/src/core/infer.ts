import { easeFlavour, isEase } from './eases';
import { isLeaf, isPlain } from './path';
import { defaults } from './overrides';
import type { Control, ControlMeta, ControlType, Entry, Group, Leaf } from './types';

/** `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. */
export const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const COLOR_FN = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

/** Digits after the decimal point, exponent notation included (`1e-7` ⇒ 7). */
export function decimals(n: number): number {
  const [mantissa, exp] = String(n).split('e');
  return Math.max(0, (mantissa!.split('.')[1]?.length ?? 0) - Number(exp ?? 0));
}

export const quantize = (v: number, step: number): number => Number(v.toFixed(decimals(step)));

/** §5 step. The cap keeps the default's own decimals reachable; the tolerance absorbs float noise (0.1·3). */
function autoStep(min: number, max: number, v: number): number {
  const cap = Number(`1e-${decimals(v)}`);
  const r = (max - min) / 300;
  if (!(r > 0)) return cap;
  const k = Math.floor(Math.log10(r));
  const nice = [1, 2, 5, 10].map((m) => Number(`${m}e${k}`)).find((c) => c >= r * (1 - 1e-9))!;
  return Math.min(nice, cap);
}

function inferType(v: Leaf, hasOptions: boolean): ControlType {
  if (typeof v === 'boolean') return 'toggle';
  if (hasOptions) return 'select';
  if (typeof v === 'number') return 'number';
  if (isEase(v)) return 'ease';
  return HEX.test(v) || COLOR_FN.test(v) ? 'color' : 'text';
}

function control(path: string, key: string, v: Leaf, m: ControlMeta, cssRig: boolean): Control {
  const options = m.options?.map((o) => (typeof o === 'object' ? o : { label: String(o), value: o }));
  const type = m.type ?? inferType(v, !!options);
  const c: Control = { path, key, type, label: m.label ?? key, hint: m.hint, unit: m.unit, options };
  if (type === 'number' && typeof v === 'number') {
    const [lo, hi] = v > 0 ? [0, v * 3] : v < 0 ? [v * 3, -v * 3] : [0, 1];
    c.min = m.min ?? lo;
    c.max = m.max ?? hi;
    c.step = m.step ?? autoStep(c.min, c.max, v);
  }
  // A css rig's values end up in CSS custom properties, so its eases must be CSS (§8).
  if (type === 'ease') c.flavour = m.flavour ?? (cssRig ? 'css' : easeFlavour(String(v)));
  return c;
}

/**
 * Resolved controls, grouped, computed once per entry from the code defaults.
 * A group is a nested object path plus `meta.group`; its label joins the labels
 * of the enclosing objects with `meta.group` by ' · '. Display order (§5): paths
 * listed in `meta.controls` first, in its key order, then the rest in key order;
 * a group sits at its lowest-ranked control.
 */
export function controlsOf(e: Entry): Group[] {
  if (e.controls) return e.controls;
  const meta = e.meta.controls ?? {};
  const listed = new Map(Object.keys(meta).map((path, i) => [path, i]));
  const groups = new Map<string, Group>();
  const parents = new Map<Group, string>();
  const rank = new Map<string, number>();

  const walk = (obj: object, prefix: string, labels: string[]): void => {
    for (const [key, v] of Object.entries(obj)) {
      const path = prefix + key;
      const m = meta[path];
      if (m === false) continue;
      if (isPlain(v)) {
        walk(v, path + '.', [...labels, m?.label ?? key]);
        continue;
      }
      if (!isLeaf(v)) continue;
      rank.set(path, listed.get(path) ?? listed.size + rank.size);
      const parent = prefix.slice(0, -1);
      const id = m?.group ? `${parent}#${m.group}` : parent;
      let g = groups.get(id);
      if (!g) {
        const label = [...labels, m?.group].filter(Boolean).join(' · ');
        g = { id, controls: [] };
        if (label) g.label = label;
        groups.set(id, g);
        parents.set(g, parent);
      }
      g.controls.push(control(path, key, v, m || {}, !!e.meta.css));
    }
  };

  walk(defaults(e), '', []);
  const at = (c: Control): number => rank.get(c.path)!;
  const low = (g: Group): number => Math.min(...g.controls.map(at));
  for (const g of groups.values()) g.controls.sort((a, b) => at(a) - at(b));
  const list = [...groups.values()].sort((a, b) => low(a) - low(b));
  // An object's hint goes under the first heading it produces, once.
  const hinted = new Set<string>();
  for (const g of list) {
    const parent = parents.get(g)!;
    const hint = (meta[parent] || undefined)?.hint;
    if (hint && !hinted.has(parent)) {
      g.hint = hint;
      hinted.add(parent);
    }
  }
  e.controls = list;
  e.controlMap = new Map(list.flatMap((g) => g.controls.map((c) => [c.path, c] as const)));
  return list;
}

export function controlAt(e: Entry, path: string): Control | undefined {
  controlsOf(e);
  return e.controlMap?.get(path);
}
