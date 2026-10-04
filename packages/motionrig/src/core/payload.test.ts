// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare } from './payload';
import type { SharePayload } from './types';

const b64 = (json: string) => Buffer.from(json).toString('base64url');

describe('share payload codec (node: the CLI uses it too)', () => {
  it('round-trips, including non-ASCII text', () => {
    const p: SharePayload = {
      v: 1,
      o: { hero: { title: 'Привет — ✓ 𝒳', duration: 1.25, on: false } },
      b: { hero: { title: 'Hi', duration: 1, on: true } },
      c: { hero: { ease: 'EASE_REVEAL' } },
      css: { faq: { '--faq-duration': '0.7s' } },
    };
    const text = encodeShare(p);
    expect(text).toMatch(/^[\w-]+$/);
    expect(decodeShare(text)).toEqual(p);
  });

  it('is base64url of UTF-8 JSON', () => {
    const p: SharePayload = { v: 1, o: { a: { x: 'é' } }, b: { a: { x: 'e' } } };
    expect(encodeShare(p)).toBe(b64(JSON.stringify(p)));
  });

  it.each([
    ['not base64', '%%%'],
    ['not JSON', b64('hello')],
    ['wrong version', b64('{"v":2,"o":{},"b":{}}')],
    ['missing overrides', b64('{"v":1,"b":{}}')],
    ['array', b64('[1]')],
    ['empty', ''],
    ['a plain gate value', '1'],
  ])('rejects %s', (_, text) => {
    expect(decodeShare(text)).toBeUndefined();
  });

  it('drops invalid parts', () => {
    const raw = {
      v: 1,
      o: { a: { x: 1, bad: [1], nested: { y: 1 } }, junk: 5 },
      b: { a: { x: 0, n: null } },
      c: { a: { x: 5, ease: 'EASE' } },
      css: 'nope',
    };
    expect(decodeShare(b64(JSON.stringify(raw)))).toEqual({
      v: 1,
      o: { a: { x: 1 } },
      b: { a: { x: 0 } },
      c: { a: { ease: 'EASE' } },
      css: {},
    });
  });
});
