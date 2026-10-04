import { beforeEach, describe, expect, it } from 'vitest';
import { controlAt, controlsOf, decimals, quantize } from './infer';
import { configure, getEntry, rig, setValue } from './registry';
import { resetForTests } from '../test/reset';
import type { Control, ControlMeta, RigMeta } from './types';

beforeEach(() => {
  resetForTests();
  configure({ enabled: true, eases: { revealEase: [0.16, 1, 0.3, 1] } });
});

const groupsOf = <T extends object>(values: T, meta: RigMeta<T> = {}) => {
  rig('t', values, meta);
  return controlsOf(getEntry('t')!);
};
const controlOf = (value: unknown, meta: RigMeta<any>['controls'] = {}): Control =>
  groupsOf({ k: value }, { controls: meta })[0]!.controls[0]!;

describe('type inference (§5 table)', () => {
  it.each([
    ['boolean ⇒ toggle', true, {}, 'toggle'],
    ['number ⇒ number', 1.2, {}, 'number'],
    ['string with options ⇒ select', 'a', { options: ['a', 'b'] }, 'select'],
    ['number with options ⇒ select', 2, { options: [1, 2] }, 'select'],
    ['palette ease ⇒ ease', 'revealEase', {}, 'ease'],
    ['gsap ease ⇒ ease', 'power2.out', {}, 'ease'],
    ['css ease ⇒ ease', 'cubic-bezier(0.2, 0.8, 0.2, 1)', {}, 'ease'],
    ['#rgb ⇒ color', '#fc0', {}, 'color'],
    ['#rgba ⇒ color', '#fc08', {}, 'color'],
    ['#rrggbb ⇒ color', '#ffcc00', {}, 'color'],
    ['#rrggbbaa ⇒ color', '#ffcc0080', {}, 'color'],
    ['rgb( ⇒ color', 'rgb(255 0 0)', {}, 'color'],
    ['hsl( ⇒ color', 'hsl(10 50% 50%)', {}, 'color'],
    ['hwb( ⇒ color', 'hwb(10 20% 30%)', {}, 'color'],
    ['lab( ⇒ color', 'lab(50% 40 59)', {}, 'color'],
    ['lch( ⇒ color', 'lch(50% 70 50)', {}, 'color'],
    ['oklab( ⇒ color', 'oklab(0.6 0.1 0.1)', {}, 'color'],
    ['oklch( ⇒ color', 'oklch(0.7 0.1 200)', {}, 'color'],
    ['color( ⇒ color', 'color(display-p3 1 0 0)', {}, 'color'],
    ['other string ⇒ text', 'Hello', {}, 'text'],
    ['five hex digits are not a color', '#abcde', {}, 'text'],
    ['a function name alone is not a color', 'lab', {}, 'text'],
    ['explicit type wins', 'power2.out', { type: 'text' }, 'text'],
  ] as [string, unknown, ControlMeta, string][])('%s', (_, value, meta, type) => {
    expect(controlOf(value, { k: meta }).type).toBe(type);
  });

  it('ease flavour: meta, else css when the value is CSS syntax, else gsap', () => {
    expect(controlOf('power2.out').flavour).toBe('gsap');
    expect(controlOf('ease-out').flavour).toBe('css');
    expect(controlOf('cubic-bezier(0, 0, 1, 1)').flavour).toBe('css');
    expect(controlOf('linear', { k: { flavour: 'css' } }).flavour).toBe('css');
  });

  it('in a css rig an ease defaults to the css flavour (§8)', () => {
    const [g] = groupsOf(
      { a: 'linear', b: 'revealEase', c: 'power2.out', d: 'linear' },
      { css: true, controls: { c: { type: 'ease' }, d: { flavour: 'gsap' } } },
    );
    expect(Object.fromEntries(g!.controls.map((c) => [c.path, c.flavour]))).toEqual({ a: 'css', b: 'css', c: 'css', d: 'gsap' });
  });

  it('normalises options and carries label, hint, unit', () => {
    const c = controlOf(2, { k: { label: 'Rows', hint: 'How many', unit: 'px', options: [1, 'two', { label: 'Three', value: 3 }] } });
    expect(c).toMatchObject({
      path: 'k',
      key: 'k',
      label: 'Rows',
      hint: 'How many',
      unit: 'px',
      options: [
        { label: '1', value: 1 },
        { label: 'two', value: 'two' },
        { label: 'Three', value: 3 },
      ],
    });
    expect(controlOf(1).label).toBe('k');
  });
});

describe('number range & step', () => {
  it.each([
    [1, 0, 3, 0.01],
    [0.035, 0, 0.105, 0.0005],
    [120, 0, 360, 1],
    [-100, -300, 300, 1],
    [0, 0, 1, 0.005],
    [1.234, 0, 3.702, 0.001],
  ])('%d ⇒ [%d, %d] step %d', (v, min, max, step) => {
    const c = controlOf(v);
    expect(c.min).toBe(min);
    expect(c.max).toBeCloseTo(max, 12);
    expect(c.step).toBe(step);
  });

  it('keeps explicit min / max / step, deriving only what is missing', () => {
    expect(controlOf(1, { k: { min: 0, max: 10, step: 0.5 } })).toMatchObject({ min: 0, max: 10, step: 0.5 });
    expect(controlOf(1, { k: { max: 30 } })).toMatchObject({ min: 0, max: 30, step: 0.1 });
  });

  it('infers from the code default, not an overridden value', () => {
    rig('t', { k: 1 });
    setValue('t', 'k', 100);
    expect(controlsOf(getEntry('t')!)[0]!.controls[0]).toMatchObject({ min: 0, max: 3 });
  });

  it('decimals / quantize trim to the step', () => {
    expect([decimals(1), decimals(0.01), decimals(0.0005), decimals(1e-7), decimals(2.5e-7)]).toEqual([0, 2, 4, 7, 8]);
    expect(quantize(0.30000000000000004, 0.01)).toBe(0.3);
    expect(quantize(1.23456, 0.0005)).toBe(1.2346);
  });
});

describe('groups', () => {
  it('top-level ungrouped controls form one unlabeled group (a listed control ranks its group first)', () => {
    const groups = groupsOf(
      { a: 1, b: 2, c: 3 },
      { controls: { b: { group: 'Timing' } } },
    );
    expect(groups.map((g) => [g.id, g.label, g.controls.map((c) => c.path)])).toEqual([
      ['#Timing', 'Timing', ['b']],
      ['', undefined, ['a', 'c']],
    ]);
  });

  it('nested objects become groups labelled by their meta label or key, joined with meta.group', () => {
    const groups = groupsOf(
      { duration: 1, enter: { rows: 12, ease: 'power2.out', deep: { x: 1 } }, exit: { y: 2 } },
      {
        controls: {
          enter: { label: 'Enter', hint: 'On first scroll' },
          'enter.ease': { group: 'Curve' },
        },
      },
    );
    // 'enter.ease' is the only listed control, so its group leads and takes the object's hint.
    expect(groups.map((g) => [g.id, g.label, g.hint, g.controls.map((c) => c.path)])).toEqual([
      ['enter#Curve', 'Enter · Curve', 'On first scroll', ['enter.ease']],
      ['', undefined, undefined, ['duration']],
      ['enter', 'Enter', undefined, ['enter.rows']],
      ['enter.deep', 'Enter · deep', undefined, ['enter.deep.x']],
      ['exit', 'exit', undefined, ['exit.y']],
    ]);
  });

  it('hides paths marked false, and everything under a hidden object', () => {
    const groups = groupsOf(
      { a: 1, secret: 2, inner: { x: 1, y: 2 }, list: [1, 2], fn: () => {} },
      { controls: { secret: false, inner: false } },
    );
    expect(groups.flatMap((g) => g.controls.map((c) => c.path))).toEqual(['a']);
  });

  it('keeps order of first appearance across flat groups', () => {
    const groups = groupsOf(
      { a: 1, b: 2, c: 3, d: 4 },
      { controls: { a: { group: 'Two' }, b: { group: 'One' }, c: { group: 'Two' } } },
    );
    expect(groups.map((g) => [g.label, g.controls.map((c) => c.key)])).toEqual([
      ['Two', ['a', 'c']],
      ['One', ['b']],
      [undefined, ['d']],
    ]);
  });

  it('controls listed in meta.controls come first, in its key order; unlisted follow in key order', () => {
    const [g] = groupsOf({ a: 1, b: 2, c: 3, d: 4 }, { controls: { c: {}, hidden: false, a: { label: 'A' } } });
    expect(g!.controls.map((c) => c.path)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('groups follow their lowest-ranked control, nested paths included; hidden entries stay out', () => {
    const groups = groupsOf(
      { duration: 1, secret: 0, enter: { rows: 12, stagger: 0.05 }, exit: { y: 2 } },
      {
        controls: {
          secret: false,
          'exit.y': {},
          'enter.stagger': {},
          enter: { label: 'Enter', hint: 'On first scroll' },
        },
      },
    );
    expect(groups.map((g) => [g.id, g.hint, g.controls.map((c) => c.path)])).toEqual([
      ['exit', undefined, ['exit.y']],
      ['enter', 'On first scroll', ['enter.stagger', 'enter.rows']],
      ['', undefined, ['duration']],
    ]);
  });

  it('an object hint goes under the first heading it produces in display order', () => {
    const groups = groupsOf(
      { enter: { a: 1, b: 2 } },
      { controls: { enter: { hint: 'H' }, 'enter.b': { group: 'Late' } } },
    );
    expect(groups.map((g) => [g.id, g.hint])).toEqual([
      ['enter#Late', 'H'],
      ['enter', undefined],
    ]);
  });

  it('controlAt finds a visible control by path through a cached path map', () => {
    rig('t', { a: 1, n: { b: 'x' }, hidden: 2 }, { controls: { hidden: false } });
    const e = getEntry('t')!;
    const b = controlsOf(e)[1]!.controls[0]!;
    expect(controlAt(e, 'n.b')).toBe(b);
    expect(e.controlMap?.get('n.b')).toBe(b);
    expect(controlAt(e, 'hidden')).toBeUndefined();
  });

  it('is computed once per entry', () => {
    rig('t', { a: 1 });
    const e = getEntry('t')!;
    expect(controlsOf(e)).toBe(controlsOf(e));
  });
});
