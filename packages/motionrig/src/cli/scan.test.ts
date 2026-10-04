// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { findProperty, findRigMatches, isMemberPath } from './scan';

// findRigCalls and splitTopLevel are tokenizer primitives — see tokenizer.test.ts.

describe('findRigMatches', () => {
  it('extracts the id and the object literal span', () => {
    const src = `rig('hero', { duration: 1.2 });`;
    const [m] = findRigMatches('f.ts', src);
    expect(m).toBeDefined();
    expect(m!.id).toBe('hero');
    expect(src.slice(m!.objStart, m!.objEnd)).toBe('{ duration: 1.2 }');
  });

  it('handles a multi-line object literal with nested braces', () => {
    const src = `rig('shutter', {\n  variant: 'arc' as CurtainVariant,\n  enter: {\n    rows: 12,\n  },\n});`;
    const [m] = findRigMatches('f.ts', src);
    expect(m!.id).toBe('shutter');
    const body = src.slice(m!.objStart, m!.objEnd);
    expect(body).toContain('rows: 12');
  });

  it('skips a call whose id is a template literal with interpolation', () => {
    const src = 'rig(`id-${n}`, { a: 1 });';
    expect(findRigMatches('f.ts', src)).toHaveLength(0);
  });
});

describe('isMemberPath', () => {
  it('accepts identifiers and dotted member expressions', () => {
    expect(isMemberPath('EASE_REVEAL')).toBe(true);
    expect(isMemberPath('EASES.reveal')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isMemberPath('EASE_REVEAL()')).toBe(false);
    expect(isMemberPath('1 + 1')).toBe(false);
    expect(isMemberPath("'a; b'")).toBe(false);
    expect(isMemberPath('a[0]')).toBe(false);
    for (const partial of ['', 'EASES.', 'EASES.reveal x', '.reveal']) expect(isMemberPath(partial), partial).toBe(false);
  });
});

describe('findProperty', () => {
  const objOf = (src: string): [string, number, number] => {
    const start = src.indexOf('{');
    let depth = 0;
    let end = start;
    for (let i = start; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    return [src, start, end];
  };

  it('finds a simple literal property', () => {
    const [src, s, e] = objOf(`{ duration: 1.2, label: 'hi' }`);
    const r = findProperty(src, s, e, ['duration']);
    expect(r.found).toBe(true);
    if (r.found && r.kind === 'literal') {
      expect(r.value).toBe(1.2);
      expect(src.slice(r.start, r.end)).toBe('1.2');
    } else throw new Error('expected literal');
  });

  it('finds a string property with a quoted (non-identifier) key', () => {
    const [src, s, e] = objOf(`{ 'faq-duration': 0.7 }`);
    const r = findProperty(src, s, e, ['faq-duration']);
    expect(r.found).toBe(true);
    if (r.found && r.kind === 'literal') expect(r.value).toBe(0.7);
    else throw new Error('expected literal');
  });

  it('keeps an `as` suffix out of the replaced span', () => {
    const [src, s, e] = objOf(`{ variant: 'arc' as CurtainVariant, }`);
    const r = findProperty(src, s, e, ['variant']);
    expect(r.found).toBe(true);
    if (r.found && r.kind === 'literal') {
      expect(r.value).toBe('arc');
      expect(src.slice(r.start, r.end)).toBe("'arc'");
    } else throw new Error('expected literal');
  });

  it('keeps a `satisfies` suffix out of the replaced span', () => {
    const [src, s, e] = objOf(`{ mode: 'x' satisfies Mode }`);
    const r = findProperty(src, s, e, ['mode']);
    expect(r.found && r.kind === 'literal' && r.value).toBe('x');
  });

  it('finds an identifier value and reports its text', () => {
    const [src, s, e] = objOf(`{ ease: EASE_REVEAL, // comment\n }`);
    const r = findProperty(src, s, e, ['ease']);
    expect(r.found).toBe(true);
    if (r.found && r.kind === 'identifier') {
      expect(r.text).toBe('EASE_REVEAL');
      expect(src.slice(r.start, r.end)).toBe('EASE_REVEAL');
    } else throw new Error('expected identifier');
  });

  it('finds a dotted member expression value', () => {
    const [src, s, e] = objOf(`{ ease: EASES.reveal }`);
    const r = findProperty(src, s, e, ['ease']);
    expect(r.found && r.kind === 'identifier' && r.text).toBe('EASES.reveal');
  });

  it('descends into a nested object for a dotted path', () => {
    const [src, s, e] = objOf(`{ enter: { rows: 12, cols: 4 }, other: 1 }`);
    const r = findProperty(src, s, e, ['enter', 'rows']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(12);
  });

  it('reports "not found" for a missing path', () => {
    const [src, s, e] = objOf(`{ a: 1 }`);
    const r = findProperty(src, s, e, ['b']);
    expect(r.found).toBe(false);
  });

  it('reports a shorthand property as unsupported', () => {
    const [src, s, e] = objOf(`{ a, b: 1 }`);
    const r = findProperty(src, s, e, ['a']);
    expect(r.found && r.kind === 'unsupported').toBe(true);
  });

  it('reports a computed property as not matching (skipped over)', () => {
    const [src, s, e] = objOf(`{ [key]: 1, b: 2 }`);
    const r = findProperty(src, s, e, ['b']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(2);
  });

  it('reports a spread as not matching a named path', () => {
    const [src, s, e] = objOf(`{ ...base, b: 2 }`);
    const r = findProperty(src, s, e, ['b']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(2);
  });

  it('reports "not an object literal" when descending into a non-object', () => {
    const [src, s, e] = objOf(`{ enter: 1 }`);
    const r = findProperty(src, s, e, ['enter', 'rows']);
    expect(r.found && r.kind === 'unsupported').toBe(true);
  });

  it('parses a negative number', () => {
    const [src, s, e] = objOf(`{ offset: -0.08 }`);
    const r = findProperty(src, s, e, ['offset']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(-0.08);
  });

  it('does not touch formatting or comments elsewhere', () => {
    const src = `{\n  // a comment\n  a: 1, // trailing\n  b: 2,\n}`;
    const start = src.indexOf('{');
    const end = src.length;
    const r = findProperty(src, start, end, ['b']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(2);
  });

  it('finds a numeric-literal key', () => {
    const [src, s, e] = objOf(`{ 1: 0.5, other: 2 }`);
    const r = findProperty(src, s, e, ['1']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(0.5);
  });

  it('accepts a leading-dot number literal (.5)', () => {
    const [src, s, e] = objOf(`{ half: .5 }`);
    const r = findProperty(src, s, e, ['half']);
    expect(r.found && r.kind === 'literal' && r.value).toBe(0.5);
  });

  it('reports specifically that a missing path may come from a spread/computed key', () => {
    const [src, s, e] = objOf(`{ ...BASE, b: 2 }`);
    const r = findProperty(src, s, e, ['missing']);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.reason).toMatch(/spread\/computed/);
  });

  it('plain "not found" reason when there is no spread/computed key at all', () => {
    const [src, s, e] = objOf(`{ a: 1 }`);
    const r = findProperty(src, s, e, ['missing']);
    expect(r.found).toBe(false);
    if (!r.found) expect(r.reason).not.toMatch(/spread\/computed/);
  });

  it('still patches a literal key that is followed by a later spread, with a shadow warning', () => {
    const [src, s, e] = objOf(`{ label: 'caf\\u00e9', ...OVERRIDES }`);
    const r = findProperty(src, s, e, ['label']);
    expect(r.found).toBe(true);
    if (r.found && r.kind === 'literal') {
      expect(r.value).toBe('café');
      expect(r.warning).toMatch(/shadowed/);
    } else throw new Error('expected literal');
  });

  it('no shadow warning when the spread comes before the key', () => {
    const [src, s, e] = objOf(`{ ...BASE, label: 'x' }`);
    const r = findProperty(src, s, e, ['label']);
    expect(r.found && r.kind === 'literal' && r.warning).toBeUndefined();
  });

  // The spread shadows the whole `enter` object (and so its nested `rows`), even though
  // the match itself bottoms out one level down — the warning must surface at the outer level too.
  it('warns on a nested path when an ancestor property is followed by a later spread', () => {
    const [src, s, e] = objOf(`{ enter: { rows: 1 }, ...BASE }`);
    const r = findProperty(src, s, e, ['enter', 'rows']);
    expect(r.found).toBe(true);
    if (r.found && r.kind === 'literal') {
      expect(r.value).toBe(1);
      expect(r.warning).toMatch(/shadowed/);
    } else throw new Error('expected literal');
  });

  // The inner object has no spread of its own after `rows` — only the outer `enter` is shadowed —
  // so the deeper level's (lack of a) warning must not stop the outer level from adding one.
  it('still warns when only the ancestor (not the nested object itself) has a later spread', () => {
    const [src, s, e] = objOf(`{ enter: { rows: 1, cols: 2 }, ...BASE }`);
    const r = findProperty(src, s, e, ['enter', 'cols']);
    expect(r.found && r.kind === 'literal' && r.warning).toMatch(/shadowed/);
  });
});
