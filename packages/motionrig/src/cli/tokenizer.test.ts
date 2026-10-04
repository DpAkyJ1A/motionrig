// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { skipBalanced, skipString, splitTopLevel, unescapeQuoted } from './tokenizer';

describe('skipString', () => {
  it('ends at an unescaped newline instead of swallowing the rest of the file (JSX apostrophes)', () => {
    const src = `'Don't blink'\nreal code here`;
    // the quote at index 0 opens a "string" that (wrongly, if unterminated) could run to EOF
    const end = skipString(src, 0);
    expect(src.slice(0, end)).not.toContain('real code here');
    expect(end).toBeLessThanOrEqual(src.indexOf('\n') + 1);
  });

  // The above actually terminates early on the apostrophe *inside* "Don't" (a
  // coincidental same-char match), not by hitting the newline branch at all. This one has no
  // closing quote anywhere before the newline, so it genuinely exercises that branch.
  it('really does stop at the newline when there is no closing quote at all on that line', () => {
    const src = "'no closing quote on this line\nreal code here";
    const end = skipString(src, 0);
    expect(end).toBe(src.indexOf('\n'));
    expect(src.slice(0, end)).not.toContain('real code here');
  });

  it('still finds a normal same-line string', () => {
    const src = `'hero', rest`;
    const end = skipString(src, 0);
    expect(src.slice(0, end)).toBe(`'hero'`);
  });
});

describe('unescapeQuoted', () => {
  it('decodes \\uXXXX', () => {
    expect(unescapeQuoted('caf\\u00e9')).toBe('café');
  });

  it('decodes \\u{...}', () => {
    expect(unescapeQuoted('\\u{1F600}')).toBe('\u{1F600}');
  });

  it('decodes \\xXX', () => {
    expect(unescapeQuoted('\\x41')).toBe('A');
  });

  it('decodes \\b \\f \\v \\0', () => {
    expect(unescapeQuoted('\\b\\f\\v\\0')).toBe('\b\f\v\0');
  });

  it('still decodes the simple escapes and drops the backslash for others', () => {
    expect(unescapeQuoted("it\\'s\\n\\t")).toBe("it's\n\t");
  });
});

describe('shared tokenizer used by skipBalanced / splitTopLevel (and findRigCalls)', () => {
  it('skipBalanced still matches nested brackets, strings, templates and comments', () => {
    const src = `{ a: [1, '}', \`t\${1}\`], /* } */ b: 2 }`;
    const end = skipBalanced(src, 0);
    expect(end).toBe(src.length);
  });

  it('splitTopLevel still only splits at depth 0', () => {
    const src = `a: 1, b: { c: 2, d: 3 }, e: 'x,y'`;
    expect(splitTopLevel(src, 0, src.length, ',')).toHaveLength(2);
  });
});
