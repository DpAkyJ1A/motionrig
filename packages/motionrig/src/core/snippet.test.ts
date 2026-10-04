import { beforeEach, describe, expect, it } from 'vitest';
import { configure, getEntry, rig, setValue } from './registry';
import { codeOf, printLeaf, snippet } from './snippet';
import { resetForTests } from '../test/reset';
import type { RigMeta } from './types';

beforeEach(() => {
  resetForTests();
  configure({ enabled: true, eases: { revealEase: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_REVEAL' }, plain: [0, 0, 1, 1] } });
});

/** The snippet without its heading line (tested on its own below). */
const print = <T extends object>(values: T, meta?: RigMeta<T>) => {
  rig('t', values, meta);
  const [head, ...rest] = snippet(getEntry('t')!).split('\n');
  expect(head).toBe(meta?.css ? '/* t */' : '// t');
  return rest.join('\n');
};

describe('copy code (TS literal)', () => {
  it('prints the §9 example exactly', () => {
    rig('hero', { duration: 1.2, ease: 'revealEase', 'faq-duration': 0.7, enter: { rows: 12 } });
    expect(snippet(getEntry('hero')!)).toBe(
      ['// hero', '{', '  duration: 1.2,', '  ease: EASE_REVEAL,', "  'faq-duration': 0.7,", '  enter: {', '    rows: 12,', '  },', '}'].join('\n'),
    );
  });

  it('prints the live (tuned) values', () => {
    rig('hero', { duration: 1.2, enter: { rows: 12 } });
    setValue('hero', 'enter.rows', 20);
    expect(snippet(getEntry('hero')!)).toContain('    rows: 20,');
  });

  it('quotes and escapes strings and non-identifier keys', () => {
    expect(print({ title: "It's a \\ path\nnext", 'a b': 1, $ok_1: true, "q'k": 2 })).toBe(
      ['{', "  title: 'It\\'s a \\\\ path\\nnext',", "  'a b': 1,", '  $ok_1: true,', "  'q\\'k': 2,", '}'].join('\n'),
    );
  });

  it('nests objects at any depth with 2-space indent and trailing commas', () => {
    expect(print({ a: { b: { c: false } }, empty: {} })).toBe(
      ['{', '  a: {', '    b: {', '      c: false,', '    },', '  },', '  empty: {},', '}'].join('\n'),
    );
  });

  it("keeps the literal's own key order, whatever meta.controls lists first", () => {
    expect(print({ a: 1, b: 2 }, { controls: { b: {}, a: {} } })).toBe(['{', '  a: 1,', '  b: 2,', '}'].join('\n'));
  });

  it('prints numbers through toFixed(6)', () => {
    expect(print({ a: 0.1 + 0.2, b: 1 / 3, c: -0, d: 1e-7 })).toBe(
      ['{', '  a: 0.3,', '  b: 0.333333,', '  c: 0,', '  d: 0,', '}'].join('\n'),
    );
  });

  it('prints an ease as its palette `code` only for ease controls', () => {
    expect(print({ ease: 'revealEase', other: 'plain', label: 'revealEase' }, { controls: { label: { type: 'text' } } })).toBe(
      ['{', '  ease: EASE_REVEAL,', "  other: 'plain',", "  label: 'revealEase',", '}'].join('\n'),
    );
  });

  it('JSON-prints unsupported values, and comments out what cannot be serialised', () => {
    class Node {
      self = this;
    }
    expect(print({ list: [1, 'a'], none: null, fn: () => {}, nested: { cyclic: new Node(), big: 1n, ok: 1 } })).toBe(
      [
        '{',
        '  list: [1,"a"],',
        '  none: null,',
        '  // fn: not serialisable',
        '  nested: {',
        '    // cyclic: not serialisable',
        '    // big: not serialisable',
        '    ok: 1,',
        '  },',
        '}',
      ].join('\n'),
    );
  });
});

describe('copy code (css rig)', () => {
  it('prints a declaration for every leaf, units included', () => {
    const text = print(
      { faqDuration: 0.7, ease: 'ease-out', enter: { gap: 26 }, hidden: 1 },
      { css: true, controls: { faqDuration: { unit: 's' }, 'enter.gap': { unit: 'rem' }, hidden: false } },
    );
    expect(text).toBe(['--faq-duration: 0.7s;', '--ease: ease-out;', '--enter-gap: 26rem;', '--hidden: 1;'].join('\n'));
  });

  it('comments out a leaf whose value is not safe css', () => {
    const text = print({ a: 'ease', b: 'x' }, { css: true });
    expect(text).toBe('--a: ease;\n--b: x;');
    setValue('t', 'b', 'url("x');
    expect(snippet(getEntry('t')!)).toBe('/* t */\n--a: ease;\n/* --b: not safe css */');
  });

  it('honours the prefix', () => {
    expect(print({ x: 1 }, { css: { prefix: 'hero-' } })).toBe('--hero-x: 1;');
  });
});

describe('copy code heading', () => {
  const head = (id: string, meta: RigMeta<object> = {}) => {
    rig(id, { x: 1 }, meta);
    return snippet(getEntry(id)!).split('\n')[0];
  };

  it('names the rig by id, and title when it says more', () => {
    expect(head('scrub', { title: 'Scroll scrub' })).toBe('// scrub — Scroll scrub');
    expect(head('hero')).toBe('// hero');
    expect(head('faq', { title: 'FAQ' })).toBe('// faq');
    expect(head('fade', { title: 'Fade in', css: true })).toBe('/* fade — Fade in */');
  });

  it('keeps a hostile title on its one comment line, and unable to close a block comment', () => {
    const title = 'x\ny\r\u2028z\u202e */ a: 1, /* {';
    const js = snippet((rig('js', { x: 1 }, { title }), getEntry('js')!));
    expect(js.split('\n')).toHaveLength(4);
    expect(js.split('\n')[0]).toBe('// js — x\\u000ay\\u000d\\u2028z\\u202e *\\/ a: 1, /* {');
    // Still pastes over the literal: `rig('js', <snippet>)` evaluates to the values.
    expect(new Function(`return (${js});`)()).toEqual({ x: 1 });
    const css = snippet((rig('css', { x: 1 }, { title, css: true }), getEntry('css')!));
    expect(css.split('\n')).toEqual(['/* css — x\\u000ay\\u000d\\u2028z\\u202e *\\/ a: 1, /* { */', '--x: 1;']);
    expect(css.match(/\*\//g)).toHaveLength(1);
  });
});

describe('printLeaf / codeOf (shared with the CLI and share payload)', () => {
  it('prints plain literals', () => {
    expect(printLeaf('a\'b')).toBe("'a\\'b'");
    expect(printLeaf(2.5)).toBe('2.5');
    expect(printLeaf(true)).toBe('true');
  });

  it('escapes control, line-separator and bidi characters as \\uXXXX', () => {
    const cases: [string, string][] = [
      ['\0', '\\u0000'], ['\t', '\\u0009'], ['\x1b', '\\u001b'], ['\x7f', '\\u007f'], ['\x9b', '\\u009b'],
      ['\u2028', '\\u2028'], ['\u2029', '\\u2029'], ['\u202a', '\\u202a'], ['\u202e', '\\u202e'],
      ['\u2066', '\\u2066'], ['\u2069', '\\u2069'],
    ];
    for (const [raw, escaped] of cases) expect(printLeaf(`a${raw}b`)).toBe(`'a${escaped}b'`);
    // The short escapes stay, and printable non-ASCII is kept as is.
    expect(printLeaf('a\nb\rc')).toBe("'a\\nb\\rc'");
    expect(printLeaf('é — ✓')).toBe("'é — ✓'");
    // What it prints is a JS string literal of the very same value.
    const tricky = 'x\u202e\u2066y\u2028z\\\'\n\x00';
    expect(new Function(`return ${printLeaf(tricky)}`)()).toBe(tricky);
  });

  it('prints palette names with `code` as identifiers unless the control is not an ease', () => {
    expect(printLeaf('revealEase')).toBe('EASE_REVEAL');
    expect(printLeaf('revealEase', { type: 'ease' })).toBe('EASE_REVEAL');
    expect(printLeaf('revealEase', { type: 'text' })).toBe("'revealEase'");
    expect(codeOf('plain')).toBeUndefined();
    expect(codeOf(1)).toBeUndefined();
  });
});
