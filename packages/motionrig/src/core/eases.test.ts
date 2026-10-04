import { beforeEach, describe, expect, it } from 'vitest';
import { setConfig } from './config';
import {
  customStart,
  easeBezier,
  easeFlavour,
  easeMenu,
  easeIndex,
  easeMode,
  formatBezier,
  isEase,
  paletteDef,
  parseBezier,
} from './eases';
import { resetForTests } from '../test/reset';

beforeEach(() => {
  resetForTests();
  setConfig({
    eases: {
      revealEase: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_REVEAL', label: 'Reveal' },
      snap: [0.5, 0, 0, 1],
    },
  });
});

describe('isEase — every §6 row', () => {
  it.each([
    ['palette key', 'revealEase'],
    ['palette key (bare bezier def)', 'snap'],
    ['gsap none', 'none'],
    ['gsap linear', 'linear'],
    ...['power0', 'power1', 'power2', 'power3', 'power4'].map((f) => ['gsap ' + f, f + '.out']),
    ...['quad', 'cubic', 'quart', 'quint', 'strong', 'expo', 'sine', 'circ', 'back', 'elastic', 'bounce'].flatMap(
      (f) => ['in', 'out', 'inOut'].map((d) => ['gsap ' + f, `${f}.${d}`]),
    ),
    ['gsap with config', 'back.out(1.7)'],
    ['gsap with multi-arg config', 'elastic.inOut(1, 0.3)'],
    ['bare bezier', '0.25,0.1,0.25,1'],
    ['bare bezier with spaces and negatives', ' .5, -0.2 , 1,1 '],
    ['css cubic-bezier', 'cubic-bezier(0.2, 0.8, 0.2, 1)'],
    ['css ease', 'ease'],
    ['css ease-in', 'ease-in'],
    ['css ease-out', 'ease-out'],
    ['css ease-in-out', 'ease-in-out'],
    ['css steps', 'steps(4, end)'],
    ['css linear()', 'linear(0, 0.25 25%, 1)'],
  ])('%s: %s', (_, v) => {
    expect(isEase(v)).toBe(true);
  });

  it.each(['power2', 'power5.out', 'expo.up', 'hello', '#fff', '1,2,3', '1,2,3,4,5', '', 'cubic-bezier', 'toString'])(
    'rejects %j',
    (v) => {
      expect(isEase(v)).toBe(false);
    },
  );
});

describe('easeFlavour', () => {
  it.each(['cubic-bezier(0,0,1,1)', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'steps(3)', 'linear(0, 1)'])(
    'css syntax %s ⇒ css',
    (v) => expect(easeFlavour(v)).toBe('css'),
  );
  it.each(['none', 'linear', 'power2.out', '0.25,0.1,0.25,1', 'revealEase', 'back.out(2)'])(
    'everything else (%s) ⇒ gsap',
    (v) => expect(easeFlavour(v)).toBe('gsap'),
  );
});

describe('bezier parse / format', () => {
  it('parses bare and cubic-bezier forms', () => {
    expect(parseBezier('0.25,0.1,0.25,1')).toEqual([0.25, 0.1, 0.25, 1]);
    expect(parseBezier(' cubic-bezier(.42, 0, .58, -1.5) ')).toEqual([0.42, 0, 0.58, -1.5]);
    expect(parseBezier('1,2,3')).toBeUndefined();
    expect(parseBezier('1.2.3,0,0,1')).toBeUndefined();
    expect(parseBezier('power2.out')).toBeUndefined();
  });

  it('formats with 3-decimal numbers per flavour', () => {
    expect(formatBezier([0.25, 0.1, 0.25, 1], 'gsap')).toBe('0.25,0.1,0.25,1');
    expect(formatBezier([0.12345, 1, 0.3, 1], 'css')).toBe('cubic-bezier(0.123, 1, 0.3, 1)');
  });

  it('round-trips', () => {
    const b: [number, number, number, number] = [0.333, -0.5, 0.667, 1.5];
    expect(parseBezier(formatBezier(b, 'gsap'))).toEqual(b);
    expect(parseBezier(formatBezier(b, 'css'))).toEqual(b);
  });
});

describe('easeBezier (known beziers)', () => {
  it.each([
    ['revealEase', [0.16, 1, 0.3, 1]],
    ['snap', [0.5, 0, 0, 1]],
    ['ease', [0.25, 0.1, 0.25, 1]],
    ['ease-in', [0.42, 0, 1, 1]],
    ['ease-out', [0, 0, 0.58, 1]],
    ['ease-in-out', [0.42, 0, 0.58, 1]],
    ['linear', [0, 0, 1, 1]],
    ['none', [0, 0, 1, 1]],
    ['power0.out', [0, 0, 1, 1]],
    ['power1.in', [0.11, 0, 0.5, 0]],
    ['quad.out', [0.5, 1, 0.89, 1]],
    ['power2.inOut', [0.65, 0, 0.35, 1]],
    ['power3.out', [0.25, 1, 0.5, 1]],
    ['power4.in', [0.64, 0, 0.78, 0]],
    ['sine.inOut', [0.37, 0, 0.63, 1]],
    ['expo.out', [0.16, 1, 0.3, 1]],
    ['circ.in', [0.55, 0, 1, 0.45]],
    ['back.in', [0.36, 0, 0.66, -0.56]],
    ['back.out(1.7)', [0.34, 1.56, 0.64, 1]],
    ['back.inOut', [0.68, -0.6, 0.32, 1.6]],
    ['0.1,0.2,0.3,0.4', [0.1, 0.2, 0.3, 0.4]],
    ['cubic-bezier(0.1, 0.2, 0.3, 0.4)', [0.1, 0.2, 0.3, 0.4]],
  ])('%s', (v, b) => {
    expect(easeBezier(v)).toEqual(b);
  });

  it.each(['elastic.out', 'bounce.in', 'steps(4)', 'linear(0, 1)', 'nope'])('%s is unknown', (v) => {
    expect(easeBezier(v)).toBeUndefined();
  });
});

describe('ease menu', () => {
  it('gsap: palette (insertion order, label ?? name) then gsap built-ins', () => {
    const m = easeMenu('gsap');
    expect(m.palette).toEqual([
      { label: 'Reveal', value: 'revealEase', bezier: [0.16, 1, 0.3, 1] },
      { label: 'snap', value: 'snap', bezier: [0.5, 0, 0, 1] },
    ]);
    expect(m.builtins.map((c) => c.value)).toEqual([
      'none',
      ...['power1', 'power2', 'power3', 'power4', 'expo', 'sine', 'circ', 'back'].flatMap((f) =>
        ['in', 'out', 'inOut'].map((d) => `${f}.${d}`),
      ),
    ]);
    expect(m.builtins.every((c) => c.label === c.value && c.bezier)).toBe(true);
  });

  it('css: palette values are cubic-bezier() of the curve, then css keywords', () => {
    const m = easeMenu('css');
    expect(m.palette.map((c) => c.value)).toEqual(['cubic-bezier(0.16, 1, 0.3, 1)', 'cubic-bezier(0.5, 0, 0, 1)']);
    expect(m.builtins.map((c) => c.value)).toEqual(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']);
  });

  it('css: the standard curves follow as cubic-bezier(), labelled easings.net-style', () => {
    const { curves } = easeMenu('css');
    const families = ['Quad', 'Cubic', 'Quart', 'Quint', 'Sine', 'Expo', 'Circ', 'Back'];
    expect(curves.map((c) => c.label)).toEqual(families.flatMap((f) => ['In', 'Out', 'InOut'].map((d) => `ease${d}${f}`)));
    expect(curves[0]).toEqual({ label: 'easeInQuad', value: 'cubic-bezier(0.11, 0, 0.5, 0)', bezier: [0.11, 0, 0.5, 0] });
    expect(curves.find((c) => c.label === 'easeOutQuint')!.value).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
    expect(easeMode('cubic-bezier(0.22, 1, 0.36, 1)', 'css')).toBe('named');
  });

  it('gsap: no extra curves (its built-ins already name them)', () => {
    expect(easeMenu('gsap').curves).toEqual([]);
  });

  it('values written for a menu choice', () => {
    const value = (flavour: 'gsap' | 'css', label: string) => {
      const { palette, builtins } = easeMenu(flavour);
      return [...palette, ...builtins].find((c) => c.label === label)!.value;
    };
    expect(value('gsap', 'Reveal')).toBe('revealEase');
    expect(value('gsap', 'power2.out')).toBe('power2.out');
    expect(value('css', 'Reveal')).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    expect(value('css', 'ease-out')).toBe('ease-out');
  });

  it('mode: named option, custom bezier, or the raw value as its own option', () => {
    expect(easeMode('revealEase', 'gsap')).toBe('named');
    expect(easeMode('expo.out', 'gsap')).toBe('named');
    expect(easeMode('0.2,0.8,0.2,1', 'gsap')).toBe('custom');
    expect(easeMode('elastic.out(1, 0.3)', 'gsap')).toBe('raw');
    expect(easeMode('cubic-bezier(0.16, 1, 0.3, 1)', 'css')).toBe('named');
    expect(easeMode('cubic-bezier(.2,.8,.2,1)', 'css')).toBe('custom');
    expect(easeMode('steps(4)', 'css')).toBe('raw');
  });

  it('css: a cubic-bezier() matches a choice by its numbers, however it is written', () => {
    const { palette, builtins, curves } = easeMenu('css');
    const all = [...palette, ...builtins, ...curves];
    const quint = all.findIndex((c) => c.label === 'easeOutQuint');
    expect(easeIndex('cubic-bezier(.22,1,.36,1)', 'css')).toBe(quint);
    expect(easeIndex(' cubic-bezier( 0.220, 1.0, 0.36, 1 ) ', 'css')).toBe(quint);
    expect(easeMode('cubic-bezier(.22,1,.36,1)', 'css')).toBe('named');
    expect(easeIndex('ease-out', 'css')).toBe(all.findIndex((c) => c.value === 'ease-out'));
    expect(easeIndex('cubic-bezier(.2,.8,.2,1)', 'css')).toBe(-1);
    // gsap keeps exact names: a bare bezier is a custom curve, not expo.out.
    expect(easeIndex('0.16,1,0.3,1', 'gsap')).toBe(-1);
    expect(easeMode('0.16,1,0.3,1', 'gsap')).toBe('custom');
  });

  it('custom curve starts from the current bezier when known, else the default', () => {
    expect(customStart('expo.out')).toEqual([0.16, 1, 0.3, 1]);
    expect(customStart('revealEase')).toEqual([0.16, 1, 0.3, 1]);
    expect(customStart('elastic.out')).toEqual([0.25, 0.1, 0.25, 1]);
  });

  it('paletteDef normalises bare beziers and ignores prototype keys', () => {
    expect(paletteDef('snap')).toEqual({ bezier: [0.5, 0, 0, 1] });
    expect(paletteDef('revealEase')?.code).toBe('EASE_REVEAL');
    expect(paletteDef('constructor')).toBeUndefined();
  });
});
