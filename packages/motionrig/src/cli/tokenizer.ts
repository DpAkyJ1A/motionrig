/**
 * A tiny, tolerant JS/TS token scanner: comments, strings, template literals (with nested `${}`)
 * and regex literals by the previous-token heuristic. No AST: just enough for `calls.ts` to find
 * `rig()` calls and for `scan.ts` to read an object literal's own property spans.
 */

const NON_VALUE_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw',
  'case', 'do', 'else', 'yield', 'await', 'extends', 'default', 'import', 'export',
  'from', 'const', 'let', 'var', 'function', 'class', 'if', 'while', 'for', 'switch',
  'try', 'catch', 'finally', 'break', 'continue', 'static', 'get', 'set', 'async',
]);

export type Prev = 'value' | 'other';

/** Past whitespace and comments; `lineComments: false` for plain CSS, where `//` is no comment. */
export function skipTrivia(src: string, i: number, lineComments = true): number {
  for (;;) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (lineComments && c === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i = Math.min(i + 2, src.length);
      continue;
    }
    break;
  }
  return i;
}

/** A single- or double-quoted string never spans a real line in valid JS; an unescaped
 *  newline ends it right there instead of swallowing the rest of the file — this is what
 *  happens when an apostrophe in JSX text (`Don't`) is mistaken for an opening quote. */
export function skipString(src: string, i: number): number {
  const quote = src[i];
  i++;
  while (i < src.length && src[i] !== quote) {
    if (src[i] === '\n' || src[i] === '\r') return i;
    if (src[i] === '\\') i++;
    i++;
  }
  return Math.min(i + 1, src.length);
}

function skipRegex(src: string, i: number): number {
  i++; // past the opening '/'
  let inClass = false;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) {
      i++;
      break;
    } else if (c === '\n') break; // unterminated; bail out rather than eat the rest of the file
    i++;
  }
  while (i < src.length && /[a-z]/i.test(src[i]!)) i++;
  return i;
}

export function skipTemplate(src: string, i: number): number {
  i++; // past the opening `
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '`') return i + 1;
    if (c === '$' && src[i + 1] === '{') {
      i = skipBalanced(src, i + 1);
      continue;
    }
    i++;
  }
  return i;
}

const OPENERS: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
const CLOSERS = new Set(['}', ')', ']']);

interface Token {
  i: number;
  prev: Prev;
  text: string;
}

/** Classifies and advances over exactly one token at `i` (past trivia): a string, template,
 *  regex (if `prev` allows it), identifier/keyword, number, or a single punctuation character.
 *  Callers that care about brackets inspect `src[i]` themselves — this doesn't track any stack. */
export function nextToken(src: string, i: number, end: number, prev: Prev): Token {
  const c = src[i]!;
  if (c === "'" || c === '"') return { i: skipString(src, i), prev: 'value', text: c };
  if (c === '`') return { i: skipTemplate(src, i), prev: 'value', text: c };
  if (c === '/' && prev !== 'value') return { i: skipRegex(src, i), prev: 'value', text: c };
  if (/[A-Za-z_$]/.test(c)) {
    let j = i + 1;
    while (j < end && /[\w$]/.test(src[j]!)) j++;
    const word = src.slice(i, j);
    return { i: j, prev: NON_VALUE_KEYWORDS.has(word) ? 'other' : 'value', text: word };
  }
  if (/[0-9]/.test(c)) {
    let j = i + 1;
    while (j < end && /[\w.]/.test(src[j]!)) j++;
    return { i: j, prev: 'value', text: src.slice(i, j) };
  }
  if (c === '}') return { i: i + 1, prev: 'other', text: c };
  if (c === ')' || c === ']') return { i: i + 1, prev: 'value', text: c };
  return { i: i + 1, prev: 'other', text: c };
}

/** From an opening `{` `(` or `[`, returns the index just past its match. */
export function skipBalanced(src: string, start: number): number {
  const stack = [OPENERS[src[start]!]!];
  let i = start + 1;
  let prev: Prev = 'other';
  while (stack.length && i < src.length) {
    i = skipTrivia(src, i);
    if (i >= src.length) break;
    const c = src[i]!;
    if (c in OPENERS) stack.push(OPENERS[c]!);
    else if (CLOSERS.has(c) && stack[stack.length - 1] === c) stack.pop();
    const t = nextToken(src, i, src.length, prev);
    i = t.i;
    prev = t.prev;
  }
  return i;
}

/** Indices, within `[start, end)`, of every top-level `sep` (nested brackets/strings/etc. skipped). */
export function splitTopLevel(src: string, start: number, end: number, sep: string): number[] {
  const positions: number[] = [];
  let i = start;
  let depth = 0;
  let prev: Prev = 'other';
  while (i < end) {
    i = skipTrivia(src, i);
    if (i >= end) break;
    const c = src[i]!;
    if (depth === 0 && c === sep) {
      positions.push(i);
      i++;
      prev = 'other';
      continue;
    }
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    const t = nextToken(src, i, end, prev);
    i = t.i;
    prev = t.prev;
  }
  return positions;
}

const ESCAPE_RE = /\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|(.))/g;
const SIMPLE_ESCAPES: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '0': '\0' };

export function unescapeQuoted(s: string): string {
  return s.replace(ESCAPE_RE, (_match, uBrace: string | undefined, u4: string | undefined, x2: string | undefined, ch: string | undefined) => {
    if (uBrace !== undefined) return String.fromCodePoint(parseInt(uBrace, 16));
    if (u4 !== undefined) return String.fromCharCode(parseInt(u4, 16));
    if (x2 !== undefined) return String.fromCharCode(parseInt(x2, 16));
    return SIMPLE_ESCAPES[ch!] ?? ch!;
  });
}
