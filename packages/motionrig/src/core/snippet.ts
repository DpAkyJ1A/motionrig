import { cssValue, cssVar, safeCss } from './css';
import { paletteDef } from './eases';
import { controlAt } from './infer';
import { isLeaf, isPlain, leaves } from './path';
import type { Control, Entry, Leaf } from './types';

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** C0, DEL, C1, line/paragraph separators and bidi controls as `\uXXXX`: pasted source (and the CLI's report) shows what it holds (Trojan Source). */
export const unseen = (s: string): string =>
  s.replace(/[\0-\x1f\x7f-\x9f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const quote = (s: string): string =>
  `'${unseen(s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r'))}'`;

/** The identifier a palette ease is written as in source (`EASE_REVEAL`), if its def has `code`. */
export const codeOf = (value: Leaf, control?: Pick<Control, 'type'>): string | undefined =>
  typeof value === 'string' && (!control || control.type === 'ease') ? paletteDef(value)?.code : undefined;

/** Source text of one leaf (§9); the CLI uses it for replacement text. */
export function printLeaf(value: Leaf, control?: Pick<Control, 'type'>): string {
  const code = codeOf(value, control);
  if (code) return code;
  if (typeof value === 'string') return quote(value);
  return typeof value === 'number' ? String(Number(value.toFixed(6))) : String(value);
}

function printObject(e: Entry, obj: object, prefix: string, indent: string): string {
  const inner = indent + '  ';
  const lines = Object.entries(obj).map(([key, v]) => {
    const path = prefix + key;
    let text: string | undefined;
    if (isPlain(v)) text = printObject(e, v, path + '.', inner);
    else if (isLeaf(v)) text = printLeaf(v, controlAt(e, path));
    else {
      try {
        text = JSON.stringify(v);
      } catch {}
    }
    if (text === undefined) return `${inner}// ${key}: not serialisable`;
    return `${inner}${IDENT.test(key) ? key : quote(key)}: ${text},`;
  });
  return lines.length ? `{\n${lines.join('\n')}\n${indent}}` : '{}';
}

/** `id — title` for the snippet's first line: kept on one line (escaped like strings) and unable to close a CSS comment. */
function heading(e: Entry): string {
  const { title } = e.meta;
  const name = title && title.toLowerCase() !== e.id.toLowerCase() ? `${e.id} — ${title}` : e.id;
  return unseen(name).replace(/\*\//g, '*\\/');
}

/** "Copy code" for a tab, headed by a comment naming the rig: the live values as a TS literal, or CSS declarations for a css rig. */
export function snippet(e: Entry): string {
  if (e.meta.css) {
    const lines = leaves(e.values).map(([path, v]) =>
      safeCss(v) ? `${cssVar(e, path)}: ${cssValue(e, path, v)};` : `/* ${cssVar(e, path)}: not safe css */`,
    );
    return [`/* ${heading(e)} */`, ...lines].join('\n');
  }
  return `// ${heading(e)}\n${printObject(e, e.values, '', '')}`;
}
