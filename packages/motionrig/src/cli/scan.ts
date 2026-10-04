import type { Leaf } from '../core/types';
import { findRigCalls } from './calls';
import { nextToken, skipBalanced, skipString, skipTemplate, skipTrivia, splitTopLevel, unescapeQuoted } from './tokenizer';
import type { Prev } from './tokenizer';

export interface RigMatch {
  file: string;
  id: string;
  /** Index of the `r` in `rig` — used for the ambiguous-match report (file:line of the call, not of its object literal). */
  callStart: number;
  objStart: number;
  objEnd: number;
}

/** `rig(<'id'|"id"|\`id\`>, { … })` call sites in `src`; other shapes (no object literal, an interpolated id) don't match. */
export function findRigMatches(file: string, src: string): RigMatch[] {
  const out: RigMatch[] = [];
  for (const call of findRigCalls(src)) {
    let i = skipTrivia(src, call.paren + 1);
    const c = src[i];
    let id: string | undefined;
    if (c === "'" || c === '"') {
      const end = skipString(src, i);
      id = unescapeQuoted(src.slice(i + 1, end - 1));
      i = end;
    } else if (c === '`') {
      const end = skipTemplate(src, i);
      const inner = src.slice(i + 1, end - 1);
      if (!inner.includes('${')) id = unescapeQuoted(inner);
      i = end;
    } else {
      continue;
    }
    if (id === undefined) continue;
    i = skipTrivia(src, i);
    if (src[i] !== ',') continue;
    i = skipTrivia(src, i + 1);
    if (src[i] !== '{') continue;
    const objEnd = skipBalanced(src, i);
    out.push({ file, id, callStart: call.start, objStart: i, objEnd });
  }
  return out;
}

const NUMBER_RE = /^-?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?/;
const IDENT_RE = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*/;

/** An identifier or dotted member expression: the only `c` (source text) entry written into code as-is. */
export const isMemberPath = (text: string): boolean => IDENT_RE.exec(text)?.[0] === text;

/** Whether identifier `name` occurs in `src` as code (not in a string, comment or after a `.`)
 *  outside `[from, to)` — i.e. the file imports or declares it, so writing it there compiles. */
export function mentions(src: string, name: string, from: number, to: number): boolean {
  let prev: Prev = 'other';
  let dot = false;
  for (let i = skipTrivia(src, 0); i < src.length; i = skipTrivia(src, i)) {
    const t = nextToken(src, i, src.length, prev);
    if (t.text === name && !dot && (i < from || i >= to)) return true;
    dot = t.text === '.';
    i = t.i;
    prev = t.prev;
  }
  return false;
}

function trailingOk(src: string, from: number, end: number): boolean {
  const rest = src.slice(from, end);
  const i = skipTrivia(rest, 0);
  if (i >= rest.length) return true;
  return /^(as|satisfies)\b/.test(rest.slice(i));
}

type ParsedValue =
  | { kind: 'literal'; value: Leaf; start: number; end: number }
  | { kind: 'identifier'; text: string; start: number; end: number }
  | { kind: 'unsupported' };

/** Reads one property value: a leaf literal, an identifier/member expression, or `unsupported`.
 *  A trailing `as T` / `satisfies T` (and trailing comments) are recognised but left untouched. */
function parseValue(src: string, start: number, end: number): ParsedValue {
  const i = skipTrivia(src, start);
  if (i >= end) return { kind: 'unsupported' };
  const c = src[i]!;
  let matchEnd: number | undefined;
  let value: Leaf | undefined;

  if (c === "'" || c === '"') {
    matchEnd = skipString(src, i);
    value = unescapeQuoted(src.slice(i + 1, matchEnd - 1));
  } else if (c === '`') {
    matchEnd = skipTemplate(src, i);
    const inner = src.slice(i + 1, matchEnd - 1);
    if (inner.includes('${')) return { kind: 'unsupported' };
    value = unescapeQuoted(inner);
  } else if (/[-0-9.]/.test(c)) {
    const m = NUMBER_RE.exec(src.slice(i, end));
    if (!m || m[0] === '' || m[0] === '-' || m[0] === '.') return { kind: 'unsupported' };
    value = Number(m[0]);
    matchEnd = i + m[0].length;
  }

  if (matchEnd !== undefined) {
    if (!trailingOk(src, matchEnd, end)) return { kind: 'unsupported' };
    return { kind: 'literal', value: value!, start: i, end: matchEnd };
  }

  const m = IDENT_RE.exec(src.slice(i, end));
  if (!m) return { kind: 'unsupported' };
  const identEnd = i + m[0].length;
  if (!trailingOk(src, identEnd, end)) return { kind: 'unsupported' };
  if (m[0] === 'true' || m[0] === 'false') return { kind: 'literal', value: m[0] === 'true', start: i, end: identEnd };
  return { kind: 'identifier', text: m[0], start: i, end: identEnd };
}

export type PropResult =
  | { found: true; kind: 'literal'; value: Leaf; start: number; end: number; raw: string; warning?: string }
  | { found: true; kind: 'identifier'; text: string; start: number; end: number; raw: string; warning?: string }
  | { found: true; kind: 'unsupported'; raw: string; reason: string }
  | { found: false; reason: string };

function classifyValue(src: string, valueStart: number, valueEnd: number): PropResult {
  const parsed = parseValue(src, valueStart, valueEnd);
  if (parsed.kind === 'unsupported') {
    return { found: true, kind: 'unsupported', raw: src.slice(valueStart, valueEnd).trim(), reason: "can't be patched (not a plain value)" };
  }
  if (parsed.kind === 'literal') {
    return { found: true, kind: 'literal', value: parsed.value, start: parsed.start, end: parsed.end, raw: src.slice(parsed.start, parsed.end) };
  }
  return { found: true, kind: 'identifier', text: parsed.text, start: parsed.start, end: parsed.end, raw: src.slice(parsed.start, parsed.end) };
}

type KeyInfo =
  | { kind: 'normal'; key: string; afterKey: number }
  | { kind: 'spread' | 'computed' | 'empty' | 'unknown' };

function parseEntryKey(src: string, start: number, end: number): KeyInfo {
  const i = skipTrivia(src, start);
  if (i >= end) return { kind: 'empty' };
  if (src.startsWith('...', i)) return { kind: 'spread' };
  const c = src[i]!;
  if (c === '[') return { kind: 'computed' };
  if (c === "'" || c === '"') {
    const strEnd = skipString(src, i);
    return { kind: 'normal', key: unescapeQuoted(src.slice(i + 1, strEnd - 1)), afterKey: strEnd };
  }
  if (c === '`') {
    const tplEnd = skipTemplate(src, i);
    const inner = src.slice(i + 1, tplEnd - 1);
    if (inner.includes('${')) return { kind: 'computed' };
    return { kind: 'normal', key: unescapeQuoted(inner), afterKey: tplEnd };
  }
  if (/[A-Za-z_$]/.test(c)) {
    let j = i + 1;
    while (j < end && /[\w$]/.test(src[j]!)) j++;
    return { kind: 'normal', key: src.slice(i, j), afterKey: j };
  }
  if (/[0-9]/.test(c)) {
    let j = i + 1;
    while (j < end && /[0-9]/.test(src[j]!)) j++;
    return { kind: 'normal', key: src.slice(i, j), afterKey: j };
  }
  return { kind: 'unknown' };
}

/** Walks an object literal's own properties (never into nested calls/other objects
 *  except along `segments`) to find the value at a dotted path. */
export function findProperty(src: string, objStart: number, objEnd: number, segments: string[]): PropResult {
  const seg = segments[0]!;
  const rest = segments.slice(1);
  const contentStart = objStart + 1;
  const contentEnd = objEnd - 1;
  const commas = splitTopLevel(src, contentStart, contentEnd, ',');
  const spans: [number, number][] = [];
  let prevEnd = contentStart;
  for (const pos of commas) {
    spans.push([prevEnd, pos]);
    prevEnd = pos + 1;
  }
  spans.push([prevEnd, contentEnd]);

  let sawSpreadOrComputed = false;

  for (let idx = 0; idx < spans.length; idx++) {
    const [s, e] = spans[idx]!;
    const trimStart = skipTrivia(src, s);
    if (trimStart >= e) continue; // trailing comma
    const keyInfo = parseEntryKey(src, s, e);
    if (keyInfo.kind === 'spread' || keyInfo.kind === 'computed') {
      sawSpreadOrComputed = true;
      continue;
    }
    if (keyInfo.kind !== 'normal') continue; // unparsable: not a match by name
    if (keyInfo.key !== seg) continue;

    const colonIdx = skipTrivia(src, keyInfo.afterKey);
    let result: PropResult;
    if (src[colonIdx] !== ':') {
      result = { found: true, kind: 'unsupported', raw: src.slice(s, e).trim(), reason: "can't be patched (shorthand property)" };
    } else {
      const valueStart = colonIdx + 1;
      if (rest.length === 0) {
        result = classifyValue(src, valueStart, e);
      } else {
        const vi = skipTrivia(src, valueStart);
        if (src[vi] !== '{') {
          result = { found: true, kind: 'unsupported', raw: src.slice(valueStart, e).trim(), reason: 'not an object literal' };
        } else {
          const nestedEnd = skipBalanced(src, vi);
          result = findProperty(src, vi, nestedEnd, rest);
        }
      }
    }

    // A later spread in this literal may override the key (or the sub-object holding it) at runtime:
    // still patched, but flagged. Checked at every level (`...BASE` after `enter` shadows `enter.rows`);
    // a deeper level's warning is kept.
    if (result.found && (result.kind === 'literal' || result.kind === 'identifier') && !result.warning) {
      const shadowedLater = spans
        .slice(idx + 1)
        .some(([s2, e2]) => skipTrivia(src, s2) < e2 && parseEntryKey(src, s2, e2).kind === 'spread');
      if (shadowedLater) return { ...result, warning: 'may be shadowed by a later spread' };
    }
    return result;
  }
  if (sawSpreadOrComputed) return { found: false, reason: "can't be patched: comes from a spread/computed key" };
  return { found: false, reason: 'not found in code' };
}
