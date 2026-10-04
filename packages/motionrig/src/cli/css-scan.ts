import { skipString, skipTrivia } from './tokenizer';

/**
 * Finds `var(--name, <fallback>)` calls in CSS-like source (`.css`, `.scss`,
 * `.sass`, `.less`) and reports the fallback's span so it can be replaced,
 * paren-balanced. `.sass` indented syntax has no braces at the rule level,
 * but a `var(...)` call's own parens work exactly the same way.
 *
 * Easy to get wrong, and each would corrupt a whole file:
 *  - `//` is a comment in scss/sass/less but never in plain CSS — `lineComments`
 *    says which dialect this file is; an unquoted `http://` must survive either way.
 *  - `url(...)` is opaque: its own `//` is never a comment even in scss/sass, and its
 *    own parens are matched independently so they never leak into an enclosing var()'s depth.
 *  - An unterminated `var(`/`url(` must never be "replaced" all the way to EOF: if the
 *    matching close paren is never found, it isn't treated as a match at all.
 */

const isWordChar = (c: string | undefined): boolean => !!c && /[\w-]/.test(c);

/** `i` is just past a `url(`'s open paren. Treats the argument as raw text — no comment or
 *  dialect handling — so an unquoted URL's `//` and any other punctuation inside are never
 *  misread. A quoted argument is still honoured, since it may itself contain `)`. Returns the
 *  index just past the matching `)`, or `src.length` if it's never closed. */
function skipUrlArg(src: string, i: number): number {
  let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i]!;
    if (c === "'" || c === '"') {
      i = skipString(src, i);
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    i++;
  }
  return i;
}

const isUrlStart = (src: string, i: number): boolean => /^url\(/i.test(src.slice(i, i + 4)) && !isWordChar(src[i - 1]);

interface VarCall {
  name: string;
  fallbackStart: number;
  fallbackEnd: number;
  callEnd: number;
}

/** `parenIdx` is the `(` of a `var(`. Returns its parsed args, or `undefined` when there's no
 *  fallback, or the call is never closed (never treated as a match — see the module doc). */
function parseVarArgs(src: string, parenIdx: number, lineComments: boolean): VarCall | undefined {
  let i = parenIdx + 1;
  let depth = 1;
  let firstComma = -1;
  const argsStart = i;
  while (i < src.length && depth > 0) {
    i = skipTrivia(src, i, lineComments);
    if (i >= src.length) break;
    const c = src[i]!;
    if (c === "'" || c === '"') {
      i = skipString(src, i);
      continue;
    }
    if (isUrlStart(src, i)) {
      i = skipUrlArg(src, i + 4);
      continue;
    }
    if (c === '(') {
      depth++;
      i++;
      continue;
    }
    if (c === ')') {
      depth--;
      i++;
      continue;
    }
    if (c === ',' && depth === 1 && firstComma === -1) {
      firstComma = i;
      i++;
      continue;
    }
    i++;
  }
  if (depth !== 0) return undefined; // never closed — don't touch anything all the way to EOF
  const callEnd = i;
  if (firstComma === -1) return undefined;
  const name = src.slice(argsStart, firstComma).trim();
  if (!name.startsWith('--')) return undefined;
  let fallbackStart = skipTrivia(src, firstComma + 1, lineComments);
  let fallbackEnd = callEnd - 1; // just before the closing ')'
  while (fallbackEnd > fallbackStart && /\s/.test(src[fallbackEnd - 1] ?? '')) fallbackEnd--;
  return { name, fallbackStart, fallbackEnd, callEnd };
}

export interface CssEdit {
  start: number;
  end: number;
  value: string;
  name: string;
}

export function findCssReplacements(src: string, values: Map<string, string>, lineComments: boolean): CssEdit[] {
  const out: CssEdit[] = [];
  let i = 0;
  while (i < src.length) {
    i = skipTrivia(src, i, lineComments);
    if (i >= src.length) break;
    const c = src[i]!;
    if (c === "'" || c === '"') {
      i = skipString(src, i);
      continue;
    }
    if (isUrlStart(src, i)) {
      i = skipUrlArg(src, i + 4);
      continue;
    }
    if (c === 'v' && src.startsWith('var(', i) && !isWordChar(src[i - 1])) {
      const call = parseVarArgs(src, i + 3, lineComments);
      if (call) {
        const value = values.get(call.name);
        if (value !== undefined) {
          out.push({ start: call.fallbackStart, end: call.fallbackEnd, value, name: call.name });
          i = call.callEnd; // fully handled — no need to rescan its own fallback
        } else {
          i += 4; // not ours — keep scanning; a nested var() in the fallback might still match
        }
      } else {
        i += 4;
      }
      continue;
    }
    i++;
  }
  return out;
}
