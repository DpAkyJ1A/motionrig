import { nextToken, skipBalanced, skipTrivia } from './tokenizer';
import type { Prev } from './tokenizer';

/** `i` at a `<`: skips a type-argument list (`rig<Cfg>`, `rig<Record<'a', 1>>`, `rig<{ a: number; b: string }>`,
 *  `rig<Foo<() => void>>`) and returns the index past its `>`, or `i` when it never closes cleanly.
 *  Brackets are skipped whole and `=>` as one token, so neither an object type's `;` nor an arrow's `>` ends it. */
function skipTypeArgs(src: string, i: number): number {
  let depth = 1;
  let j = i + 1;
  let prev: Prev = 'other';
  while (depth > 0 && j < src.length) {
    j = skipTrivia(src, j);
    if (j >= src.length) return i;
    const c = src[j]!;
    if (c === '{' || c === '(' || c === '[') {
      j = skipBalanced(src, j);
      prev = 'value';
      continue;
    }
    if (c === ';') return i; // never valid at the top level of a type-argument list
    if (c === '=' && src[j + 1] === '>') {
      j += 2;
      prev = 'other';
      continue;
    }
    if (c === '<') {
      depth++;
      j++;
      prev = 'other';
      continue;
    }
    if (c === '>') {
      depth--;
      j++;
      prev = 'value';
      continue;
    }
    const t = nextToken(src, j, src.length, prev);
    j = t.i;
    prev = t.prev;
  }
  return depth === 0 ? j : i;
}

export interface RigCall {
  /** Index of the `r` in `rig` — the call's own position, for reporting. */
  start: number;
  /** Index of the `(`. */
  paren: number;
}

/** Every standalone `rig(` or `rig<T>(` call (not `foo.rig(`, not in a comment/string). */
export function findRigCalls(src: string): RigCall[] {
  const calls: RigCall[] = [];
  let i = 0;
  let prev: Prev = 'other';
  let lastChar = '';
  while (i < src.length) {
    i = skipTrivia(src, i);
    if (i >= src.length) break;
    const start = i;
    const t = nextToken(src, i, src.length, prev);
    if (t.text === 'rig' && lastChar !== '.') {
      let after = skipTrivia(src, t.i);
      if (src[after] === '<') after = skipTrivia(src, skipTypeArgs(src, after));
      if (src[after] === '(') calls.push({ start, paren: after });
    }
    lastChar = t.text[t.text.length - 1] ?? '';
    i = t.i;
    prev = t.prev;
  }
  return calls;
}
