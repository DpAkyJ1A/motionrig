import { getConfig } from './config';
import type { Bezier, EaseDef, Flavour } from './types';

export interface EaseChoice {
  label: string;
  /** The value written to the rig when this choice is picked. */
  value: string;
  bezier?: Bezier;
}

export interface EaseMenu {
  palette: EaseChoice[];
  builtins: EaseChoice[];
  /** css only: the standard curves as `cubic-bezier()`, named easings.net-style (`easeOutQuint`). */
  curves: EaseChoice[];
}

const GSAP = /^(none|linear|(power[0-4]|quad|cubic|quart|quint|strong|expo|sine|circ|back|elastic|bounce)\.(in|out|inOut)(\(.*\))?)$/;
const BARE = /^\s*-?[\d.]+(\s*,\s*-?[\d.]+){3}\s*$/;
const CSS = /^(ease(-in|-out|-in-out)?|(cubic-bezier|steps|linear)\(.*\))$/;

const DIRS = ['in', 'out', 'inOut'];
const CSS_KEYWORDS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'];
const GSAP_BUILTINS = [
  'none',
  ...['power1', 'power2', 'power3', 'power4', 'expo', 'sine', 'circ', 'back'].flatMap((f) =>
    DIRS.map((d) => `${f}.${d}`),
  ),
];

/** GSAP curves approximated as beziers (in / out / inOut), for thumbnails and custom starts. */
const FAMILIES: Record<string, string> = {
  quad: '.11,0,.5,0 .5,1,.89,1 .45,0,.55,1',
  cubic: '.32,0,.67,0 .33,1,.68,1 .65,0,.35,1',
  quart: '.5,0,.75,0 .25,1,.5,1 .76,0,.24,1',
  quint: '.64,0,.78,0 .22,1,.36,1 .83,0,.17,1',
  sine: '.12,0,.39,0 .61,1,.88,1 .37,0,.63,1',
  expo: '.7,0,.84,0 .16,1,.3,1 .87,0,.13,1',
  circ: '.55,0,1,.45 0,.55,.45,1 .85,0,.15,1',
  back: '.36,0,.66,-.56 .34,1.56,.64,1 .68,-.6,.32,1.6',
  power0: '0,0,1,1 0,0,1,1 0,0,1,1',
};
const POWER_ALIAS: Record<string, string> = { power1: 'quad', power2: 'cubic', power3: 'quart', power4: 'quint' };
const CURVE_FAMILIES = ['quad', 'cubic', 'quart', 'quint', 'sine', 'expo', 'circ', 'back'];
const cap = (w: string): string => w[0]!.toUpperCase() + w.slice(1);

let known: Map<string, Bezier> | undefined;
const knownBeziers = (): Map<string, Bezier> => {
  if (known) return known;
  known = new Map<string, Bezier>([
    ['ease', [0.25, 0.1, 0.25, 1]],
    ['ease-in', [0.42, 0, 1, 1]],
    ['ease-out', [0, 0, 0.58, 1]],
    ['ease-in-out', [0.42, 0, 0.58, 1]],
    ['linear', [0, 0, 1, 1]],
    ['none', [0, 0, 1, 1]],
  ]);
  for (const family of [...Object.keys(FAMILIES), ...Object.keys(POWER_ALIAS)]) {
    const curves = FAMILIES[POWER_ALIAS[family] ?? family]!.split(' ');
    DIRS.forEach((d, i) => known!.set(`${family}.${d}`, parseBezier(curves[i]!)!));
  }
  return known;
};

export function paletteDef(name: string): EaseDef | undefined {
  const eases = getConfig().eases;
  if (!eases || !Object.prototype.hasOwnProperty.call(eases, name)) return undefined;
  const def = eases[name]!;
  return Array.isArray(def) ? { bezier: def } : def;
}

export const isEase = (v: string): boolean =>
  !!paletteDef(v) || GSAP.test(v) || BARE.test(v) || CSS.test(v);

/** Bare `linear` is valid in both; it counts as gsap unless the control says otherwise. */
export const easeFlavour = (v: string): Flavour => (CSS.test(v) ? 'css' : 'gsap');

export function parseBezier(s: string): Bezier | undefined {
  const inner = s.trim().replace(/^cubic-bezier\((.*)\)$/, '$1');
  if (!BARE.test(inner)) return undefined;
  const n = inner.split(',').map(Number);
  return n.every(Number.isFinite) ? (n as Bezier) : undefined;
}

export function formatBezier(b: Bezier, flavour: Flavour): string {
  const n = b.map((x) => Number(x.toFixed(3)));
  return flavour === 'css' ? `cubic-bezier(${n.join(', ')})` : n.join(',');
}

export const easeBezier = (v: string): Bezier | undefined =>
  paletteDef(v)?.bezier ?? knownBeziers().get(v.replace(/^(\w+\.\w+)\(.*\)$/, '$1')) ?? parseBezier(v);

export const customStart = (v: string): Bezier => easeBezier(v) ?? [0.25, 0.1, 0.25, 1];

/** gsap writes names; css writes `cubic-bezier()` for palette curves and keeps keywords. */
function easeValue(name: string, flavour: Flavour): string {
  const def = flavour === 'css' ? paletteDef(name) : undefined;
  return def ? formatBezier(def.bezier, 'css') : name;
}

export function easeMenu(flavour: Flavour): EaseMenu {
  const palette = Object.keys(getConfig().eases ?? {}).map((name) => {
    const def = paletteDef(name)!;
    return { label: def.label ?? name, value: easeValue(name, flavour), bezier: def.bezier };
  });
  const builtins = (flavour === 'css' ? CSS_KEYWORDS : GSAP_BUILTINS).map((name) => ({
    label: name,
    value: name,
    bezier: easeBezier(name),
  }));
  // So a hand-written `cubic-bezier(0.22, 1, 0.36, 1)` reads as easeOutQuint, not as a custom curve.
  const curves = flavour === 'css' ? CURVE_FAMILIES.flatMap((f) =>
    DIRS.map((d) => {
      const bezier = knownBeziers().get(`${f}.${d}`)!;
      return { label: `ease${cap(d)}${cap(f)}`, value: formatBezier(bezier, 'css'), bezier };
    }),
  ) : [];
  return { palette, builtins, curves };
}

/**
 * Index of `value` among palette, builtins and curves (in that order), or -1. A css
 * `cubic-bezier()` matches by its numbers, so `cubic-bezier(.22,1,.36,1)` reads as easeOutQuint.
 */
export function easeIndex(value: string, flavour: Flavour): number {
  const { palette, builtins, curves } = easeMenu(flavour);
  const b = flavour === 'css' && /^\s*cubic-bezier\(/.test(value) ? parseBezier(value) : undefined;
  const norm = b && formatBezier(b, 'css');
  return [...palette, ...builtins, ...curves].findIndex(
    (c) => c.value === value || (!!norm && !!c.bezier && formatBezier(c.bezier, 'css') === norm),
  );
}

export function easeMode(value: string, flavour: Flavour): 'named' | 'custom' | 'raw' {
  if (easeIndex(value, flavour) >= 0) return 'named';
  return parseBezier(value) ? 'custom' : 'raw';
}
