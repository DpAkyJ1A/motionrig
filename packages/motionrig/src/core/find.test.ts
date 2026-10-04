// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { findShare } from './find';
import { encodeShare } from './payload';
import type { SharePayload } from './types';

const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: { hero: { duration: 1 } } };
const encoded = encodeShare(payload);

describe('findShare (panel paste, CLI input)', () => {
  it.each([
    ['the encoded payload', encoded],
    ['the payload with surrounding whitespace', `\n  ${encoded}\n`],
    ['a link with it in ?rig, among other params and a hash', `https://example.com/page?x=1&rig=${encoded}#top`],
    ['a link from a site with another param name', `https://example.com/?tune=${encoded}`],
    ['the payload as JSON', JSON.stringify(payload, null, 2)],
  ])('reads %s', (_, text) => {
    expect(findShare(text)).toEqual(payload);
  });

  it.each([
    ['blank text', '  '],
    ['a search term', 'hero'],
    ['a link with no payload in its params', 'https://example.com/?q=1'],
    ['a link holding the payload outside its params', `https://example.com/${encoded}`],
    ['JSON that is not a payload', '{"v":2,"o":{},"b":{}}'],
  ])('finds nothing in %s', (_, text) => {
    expect(findShare(text)).toBeUndefined();
  });

  it('checks JSON like an encoded payload, dropping invalid parts', () => {
    const dirty = { v: 1, o: { hero: { duration: 1.2, bad: { x: 1 } } }, b: {} };
    expect(findShare(JSON.stringify(dirty))).toEqual({ v: 1, o: { hero: { duration: 1.2 } }, b: {} });
  });
});
