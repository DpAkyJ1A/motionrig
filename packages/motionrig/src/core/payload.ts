import { isLeaf, isPlain, table } from './path';
import type { SharePayload } from './types';

// Kept apart from share.ts so the gate (core bundle) and the CLI get the codec
// without the payload builder and its panel-side dependencies.

const isText = (v: unknown): v is string => typeof v === 'string';

export function encodeShare(p: SharePayload): string {
  let bin = '';
  for (const byte of new TextEncoder().encode(JSON.stringify(p))) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Validates shape and leaf types, dropping anything invalid; `undefined` if `p` isn't a payload. */
export function validateShare(p: unknown): SharePayload | undefined {
  if (!isPlain(p) || p.v !== 1 || !isPlain(p.o)) return undefined;
  const out: SharePayload = { v: 1, o: table(p.o, isLeaf), b: table(p.b, isLeaf) };
  if ('c' in p) out.c = table(p.c, isText);
  if ('css' in p) out.css = table(p.css, isText);
  return out;
}

/** Reads `encodeShare`'s text, validated by `validateShare`. */
export function decodeShare(text: string): SharePayload | undefined {
  try {
    const bin = atob(text.trim().replace(/-/g, '+').replace(/_/g, '/'));
    const p: unknown = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    return validateShare(p);
  } catch {
    return undefined;
  }
}
