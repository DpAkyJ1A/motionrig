// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { findCssReplacements } from './css-scan';

describe('findCssReplacements', () => {
  it('replaces a var() fallback, paren-balanced, in css', () => {
    const src = `.x { color: var(--faq-ease, cubic-bezier(1, 0, 0, 1)); }`;
    const values = new Map([['--faq-ease', 'cubic-bezier(0.4, 0, 1, 1)']]);
    const edits = findCssReplacements(src, values, false);
    expect(edits).toHaveLength(1);
    const e = edits[0]!;
    const patched = src.slice(0, e.start) + e.value + src.slice(e.end);
    expect(patched).toBe('.x { color: var(--faq-ease, cubic-bezier(0.4, 0, 1, 1)); }');
  });

  it('replaces a var() fallback in .sass indented syntax', () => {
    const src = `.x\n  color: var(--faq-ease, cubic-bezier(1, 0, 0, 1))\n`;
    const values = new Map([['--faq-ease', '0.7s']]);
    const edits = findCssReplacements(src, values, true);
    expect(edits).toHaveLength(1);
    const e = edits[0]!;
    const patched = src.slice(0, e.start) + e.value + src.slice(e.end);
    expect(patched).toBe('.x\n  color: var(--faq-ease, 0.7s)\n');
  });

  it('ignores var() with no fallback', () => {
    const src = `.x { color: var(--faq-ease); }`;
    const values = new Map([['--faq-ease', '0.7s']]);
    expect(findCssReplacements(src, values, false)).toHaveLength(0);
  });

  it('ignores var() for a name not in the payload', () => {
    const src = `.x { color: var(--other, red); }`;
    const values = new Map([['--faq-ease', '0.7s']]);
    expect(findCssReplacements(src, values, false)).toHaveLength(0);
  });

  it('ignores var(...) occurrences inside comments', () => {
    const src = `/* var(--faq-ease, red) */\n.x { color: blue; }`;
    const values = new Map([['--faq-ease', '0.7s']]);
    expect(findCssReplacements(src, values, false)).toHaveLength(0);
  });

  it('ignores a line comment in scss/sass (lineComments: true)', () => {
    const src = `// var(--faq-ease, red)\n.x { color: blue; }`;
    const values = new Map([['--faq-ease', '0.7s']]);
    expect(findCssReplacements(src, values, true)).toHaveLength(0);
  });

  it('does not match a longer identifier ending in "var("', () => {
    const src = `.x { color: myvar(--faq-ease, red); }`;
    const values = new Map([['--faq-ease', '0.7s']]);
    expect(findCssReplacements(src, values, false)).toHaveLength(0);
  });

  it('replaces more than one var() in the same file', () => {
    const src = `.x { a: var(--one, 1s); b: var(--two, 2s); }`;
    const values = new Map([
      ['--one', '9s'],
      ['--two', '8s'],
    ]);
    const edits = findCssReplacements(src, values, false);
    expect(edits).toHaveLength(2);
  });

  // `//` is not a comment marker in plain .css — a bare "//" inside a var() must survive.
  it('a bare "//" inside a fallback is not a comment in plain .css (lineComments: false)', () => {
    const src = `.a { transition: var(--a, 1s // note); }`;
    const values = new Map([['--a', '2s']]);
    const edits = findCssReplacements(src, values, false);
    expect(edits).toHaveLength(1);
    expect(src.slice(edits[0]!.start, edits[0]!.end)).toBe('1s // note');
  });

  // The real-world trigger for the same class of bug: a URL's "//" must never be a comment.
  it('a url(http://...) fallback is not broken by "//", in plain .css', () => {
    const src = `.a { background: url(http://x.com/a.png); color: var(--faq-ease, red); }`;
    const values = new Map([['--faq-ease', 'blue']]);
    const edits = findCssReplacements(src, values, false);
    expect(edits).toHaveLength(1);
    const e = edits[0]!;
    const patched = src.slice(0, e.start) + e.value + src.slice(e.end);
    expect(patched).toBe(`.a { background: url(http://x.com/a.png); color: var(--faq-ease, blue); }`);
  });

  // An unclosed var() must never be "replaced" to end of file — no match at all.
  it('finds nothing for an unclosed var(), leaving the rest of the file alone', () => {
    const src = `.a { background: var(--bg, url(http://x.com/a.png);\n.d { transition: var(--d, 1s); }\n`;
    // one closing paren is missing after the url(...) call, so --bg's var() never closes
    const values = new Map([
      ['--bg', 'none'],
      ['--d', '2s'],
    ]);
    const edits = findCssReplacements(src, values, false);
    expect(edits.some((e) => e.name === '--bg')).toBe(false);
    expect(edits.some((e) => e.name === '--d')).toBe(true);
  });

  // Url(...) is opaque even when line comments are enabled (scss/sass) — its "//" is never a comment.
  it('treats url(...) as opaque so its "//" is never a comment, even with lineComments: true', () => {
    const src = `.a { background: url(http://x.com/a.png); color: var(--faq-ease, red); }`;
    const values = new Map([['--faq-ease', 'blue']]);
    const edits = findCssReplacements(src, values, true);
    expect(edits).toHaveLength(1);
  });

  // A nested fallback must still be reachable when the outer var isn't in the payload.
  it('patches a nested fallback var(--b, ...) when the outer var(--a, ...) is not in the payload', () => {
    const src = `.a { transition-duration: var(--a, var(--b, 1s)); }`;
    const values = new Map([['--b', '9s']]);
    const edits = findCssReplacements(src, values, false);
    expect(edits).toHaveLength(1);
    const e = edits[0]!;
    expect(e.name).toBe('--b');
    const patched = src.slice(0, e.start) + e.value + src.slice(e.end);
    expect(patched).toBe('.a { transition-duration: var(--a, var(--b, 9s)); }');
  });
});
