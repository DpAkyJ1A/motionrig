import type { ReactNode } from 'react';
import s from './CodeBlock.module.css';
import type { Lang } from './lang';

export { type Lang, langOf } from './lang';

/** Token kinds; each is a class in CodeBlock.module.css. Plain text has none. */
type Kind = 'kw' | 'str' | 'num' | 'com' | 'fn' | 'type' | 'prop' | 'tag' | 'attr' | 'var' | 'punct' | 'sel';
type Token = { k?: Kind; v: string };

const KEYWORDS = new Set(
  'import from export default const let var function return if else for of in while do switch case break continue new await async typeof instanceof void delete throw try catch finally class extends implements interface type enum as satisfies keyof readonly declare namespace yield static this super'.split(
    ' ',
  ),
);
const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
const TYPES = new Set(['string', 'number', 'boolean', 'object', 'unknown', 'any', 'never', 'bigint', 'symbol']);

const ID = /[A-Za-z_$][\w$]*/y;
const NUM = /(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)n?/y;
const WS = /\s+/y;
const PUNCT = /=>|\.\.\.|\?\.|\?\?|[!=]==?|[<>]=?|&&|\|\||[-+*/%&|^~!?:;,.=(){}[\]<>@#]/y;

function at(re: RegExp, src: string, i: number): string | undefined {
  re.lastIndex = i;
  return re.exec(src)?.[0];
}

// --- JavaScript / TypeScript / TSX ---------------------------------------------------------

/** Scans JS-family source; `jsx` turns on tags in expression position. */
function scanJs(src: string, jsx: boolean): Token[] {
  const out: Token[] = [];
  let i = 0;
  // The last significant token decides whether a `<` opens a tag (`return (<div`) or compares / types (`useRef<T>`).
  let prev: Token | undefined;
  const push = (t: Token) => {
    out.push(t);
    if (t.k !== 'com' && t.v.trim()) prev = t;
  };
  const exprStart = () =>
    !prev || (prev.k === 'punct' && !/^[)\]}]$/.test(prev.v)) || (prev.k === 'kw' && !/^(this|super)$/.test(prev.v));
  const space = () => {
    const ws = at(WS, src, i);
    if (ws) {
      out.push({ v: ws });
      i += ws.length;
    }
    return !!ws;
  };
  const quoted = (q: string) => {
    let j = i + 1;
    while (j < src.length && src[j] !== q && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
    push({ k: 'str', v: src.slice(i, j + 1) });
    i = j + 1;
  };
  const braced = () => {
    push({ k: 'punct', v: '{' });
    i++;
    code(true);
    if (src[i] === '}') {
      push({ k: 'punct', v: '}' });
      i++;
    }
  };

  // Code up to the `}` that closes an enclosing `${` or JSX `{` (when `nested`), or the end.
  function code(nested: boolean): void {
    let depth = 0;
    while (i < src.length) {
      if (space()) continue;
      const c = src[i]!;
      if (nested && c === '}' && depth === 0) return;
      if (c === '/' && src[i + 1] === '/') {
        const end = src.indexOf('\n', i);
        const stop = end < 0 ? src.length : end;
        push({ k: 'com', v: src.slice(i, stop) });
        i = stop;
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        const end = src.indexOf('*/', i + 2);
        const stop = end < 0 ? src.length : end + 2;
        push({ k: 'com', v: src.slice(i, stop) });
        i = stop;
        continue;
      }
      if (c === "'" || c === '"') {
        quoted(c);
        continue;
      }
      if (c === '`') {
        template();
        continue;
      }
      if (jsx && c === '<' && exprStart() && /[A-Za-z>]/.test(src[i + 1] ?? '')) {
        element();
        continue;
      }
      const num = /\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] ?? '')) ? at(NUM, src, i) : undefined;
      if (num) {
        push({ k: 'num', v: num });
        i += num.length;
        continue;
      }
      const id = at(ID, src, i);
      if (id) {
        i += id.length;
        const after = src.slice(i);
        const next = after.match(/^\s*(\S)/)?.[1];
        const member = prev?.v === '.' || prev?.v === '?.';
        let k: Kind | undefined;
        if (member) k = next === '(' ? 'fn' : 'prop';
        else if (LITERALS.has(id)) k = 'num';
        else if (KEYWORDS.has(id)) k = 'kw';
        else if (TYPES.has(id)) k = 'type';
        else if (next === '(' || /^\s*<[\w\s,.[\]|]+>\s*\(/.test(after)) k = 'fn';
        else if (/^[A-Z]/.test(id)) k = 'type';
        else if (next === ':' && prev && /^[{,]$/.test(prev.v)) k = 'prop';
        push({ k, v: id });
        continue;
      }
      const p = at(PUNCT, src, i) ?? c;
      if (p === '{') depth++;
      if (p === '}') depth--;
      push({ k: 'punct', v: p });
      i += p.length;
    }
  }

  function template(): void {
    let j = i + 1;
    let start = i;
    while (j < src.length && src[j] !== '`') {
      if (src[j] === '\\') {
        j += 2;
        continue;
      }
      if (src[j] === '$' && src[j + 1] === '{') {
        push({ k: 'str', v: src.slice(start, j) });
        push({ k: 'punct', v: '${' });
        i = j + 2;
        code(true);
        push({ k: 'punct', v: '}' });
        j = i + 1;
        start = j;
        continue;
      }
      j++;
    }
    push({ k: 'str', v: src.slice(start, j + 1) });
    i = j + 1;
  }

  // `<Tag a="b" c={x}>children</Tag>`, fragments and self-closing tags, nested.
  function element(): void {
    tag();
    if (prev?.v === '/>') return;
    let depth = 1;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') {
        braced();
        continue;
      }
      if (src[i] === '<') {
        const closing = src[i + 1] === '/';
        tag();
        if (closing) depth--;
        else if (prev?.v !== '/>') depth++;
        continue;
      }
      const text = src.slice(i).match(/^[^<{]+/)?.[0] ?? src[i]!;
      out.push({ v: text });
      i += text.length;
    }
  }

  function tag(): void {
    const closing = src[i + 1] === '/';
    push({ k: 'punct', v: closing ? '</' : '<' });
    i += closing ? 2 : 1;
    const name = at(/[\w.:-]*/y, src, i) ?? '';
    if (name) push({ k: /^[A-Z]/.test(name) ? 'type' : 'tag', v: name });
    i += name.length;
    while (i < src.length) {
      if (space()) continue;
      if (src.startsWith('/>', i)) {
        push({ k: 'punct', v: '/>' });
        i += 2;
        return;
      }
      if (src[i] === '>') {
        push({ k: 'punct', v: '>' });
        i++;
        return;
      }
      if (src[i] === '{') {
        braced();
        continue;
      }
      if (src[i] === '"' || src[i] === "'") {
        quoted(src[i]!);
        continue;
      }
      const attr = at(/[\w:.-]+/y, src, i);
      if (attr) {
        push({ k: 'attr', v: attr });
        i += attr.length;
        continue;
      }
      push({ k: 'punct', v: src[i]! });
      i++;
    }
  }

  code(false);
  return out;
}

// --- CSS ----------------------------------------------------------------------------------

function scanCss(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let inDecl = false;
  while (i < src.length) {
    const c = src[i]!;
    const ws = at(WS, src, i);
    if (ws) {
      out.push({ v: ws });
      i += ws.length;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out.push({ k: 'com', v: src.slice(i, stop) });
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      const stop = end < 0 ? src.length : end + 1;
      out.push({ k: 'str', v: src.slice(i, stop) });
      i = stop;
      continue;
    }
    if (c === '{' || c === '}' || c === ';') {
      out.push({ k: 'punct', v: c });
      inDecl = false;
      i++;
      continue;
    }
    if (c === '@') {
      const rule = at(/@[\w-]+/y, src, i) ?? c;
      out.push({ k: 'kw', v: rule });
      i += rule.length;
      continue;
    }
    if (!inDecl) {
      // A declaration when `:` comes before the statement ends; a selector when `{` does.
      const rest = src.slice(i);
      const colon = rest.indexOf(':');
      const end = rest.search(/[{;}]/);
      if (colon >= 0 && (end < 0 || colon < end) && rest[end] !== '{') {
        const name = rest.slice(0, colon);
        out.push({ k: name.startsWith('--') ? 'var' : 'prop', v: name });
        out.push({ k: 'punct', v: ':' });
        i += colon + 1;
        inDecl = true;
        continue;
      }
      const sel = rest.slice(0, end < 0 ? undefined : end);
      for (const m of sel.matchAll(/(\s+)|([.#][\w-]+)|(::?[\w-]+)|(\d+%|\bfrom\b|\bto\b)|([\w-]+)|([^\s.#:\w-]+)/g)) {
        if (m[1]) out.push({ v: m[1] });
        else if (m[2]) out.push({ k: 'sel', v: m[2] });
        else if (m[3]) out.push({ k: 'kw', v: m[3] });
        else if (m[4]) out.push({ k: 'num', v: m[4] });
        else if (m[5]) out.push({ k: 'tag', v: m[5] });
        else out.push({ k: 'punct', v: m[6]! });
      }
      i += sel.length;
      continue;
    }
    const num = /[\w-]/.test(src[i - 1] ?? '') ? undefined : at(/-?(?:\d+\.?\d*|\.\d+)(?:%|[a-z]+)?/y, src, i);
    if (num) {
      out.push({ k: 'num', v: num });
      i += num.length;
      continue;
    }
    const hex = at(/#[\da-fA-F]{3,8}\b/y, src, i);
    if (hex) {
      out.push({ k: 'num', v: hex });
      i += hex.length;
      continue;
    }
    const word = at(/--[\w-]+|[\w-]+/y, src, i);
    if (word) {
      const k: Kind | undefined = word.startsWith('--')
        ? 'var'
        : src[i + word.length] === '('
          ? 'fn'
          : word === 'important'
            ? 'kw'
            : undefined;
      out.push({ k, v: word });
      i += word.length;
      continue;
    }
    out.push({ k: 'punct', v: c });
    i++;
  }
  return out;
}

// --- Shell, JSON, HTML --------------------------------------------------------------------

function scanSh(src: string): Token[] {
  const out: Token[] = [];
  for (const line of src.split(/(?<=\n)/)) {
    // The first word of a command is the program.
    let cmd = true;
    for (const m of line.matchAll(
      /(\s+)|(#.*)|("(?:\\.|[^"\\])*"|'[^']*')|(\$\{?\w+\}?)|(&&|\|\||[|;])|(--?[\w-]+)|(https?:\/\/\S+)|(\S+)/g,
    )) {
      if (m[1]) {
        out.push({ v: m[1] });
        continue;
      }
      if (m[5]) {
        out.push({ k: 'punct', v: m[5] });
        cmd = true;
        continue;
      }
      if (m[2]) out.push({ k: 'com', v: m[2] });
      else if (m[3] || m[7]) out.push({ k: 'str', v: (m[3] ?? m[7])! });
      else if (m[4]) out.push({ k: 'var', v: m[4] });
      else if (m[6]) out.push({ k: 'attr', v: m[6] });
      else out.push({ k: cmd ? 'fn' : /^\d+(\.\d+)?$/.test(m[8]!) ? 'num' : undefined, v: m[8]! });
      cmd = false;
    }
  }
  return out;
}

function scanJson(src: string): Token[] {
  const out: Token[] = [];
  for (const m of src.matchAll(/(\s+)|("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?|true|false|null)|(\S)/g)) {
    if (m[1]) out.push({ v: m[1] });
    else if (m[2]) {
      out.push({ k: m[3] ? 'prop' : 'str', v: m[2] });
      if (m[3]) out.push({ k: 'punct', v: m[3] });
    } else if (m[4]) out.push({ k: 'num', v: m[4] });
    else out.push({ k: 'punct', v: m[5]! });
  }
  return out;
}

function scanHtml(src: string): Token[] {
  const out: Token[] = [];
  for (const m of src.matchAll(
    /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)|(\/?>)|(\s+)|("[^"]*"|'[^']*')|([\w:-]+)(?==)|(=)|([^<>"'=\s]+)/g,
  )) {
    if (m[1]) out.push({ k: 'com', v: m[1] });
    else if (m[2]) {
      out.push({ k: 'punct', v: m[2] });
      out.push({ k: 'tag', v: m[3]! });
    } else if (m[4] || m[8]) out.push({ k: 'punct', v: (m[4] ?? m[8])! });
    else if (m[5]) out.push({ v: m[5] });
    else if (m[6]) out.push({ k: 'str', v: m[6] });
    else if (m[7]) out.push({ k: 'attr', v: m[7] });
    else out.push({ v: m[9]! });
  }
  return out;
}

function scan(code: string, lang: Lang): Token[] {
  if (lang === 'css') return scanCss(code);
  if (lang === 'sh') return scanSh(code);
  if (lang === 'json') return scanJson(code);
  if (lang === 'html') return scanHtml(code);
  return scanJs(code, lang !== 'ts');
}

/** Tokens split into lines; a token that spans lines (a block comment, a template) is cut at each newline. */
function rows(code: string, lang: Lang): Token[][] {
  const out: Token[][] = [[]];
  for (const t of scan(code, lang)) {
    t.v.split('\n').forEach((v, n) => {
      if (n) out.push([]);
      if (v) out[out.length - 1]!.push({ k: t.k, v });
    });
  }
  return out;
}

const render = (row: Token[], line: number): ReactNode[] =>
  row.map((t, n) =>
    t.k ? (
      <span key={`${line}.${n}`} className={s[t.k]}>
        {t.v}
      </span>
    ) : (
      t.v
    ),
  );

/**
 * A small highlighter, complete for the languages this site shows. It runs on the
 * server for every static block; only the landing's live diff runs it in the browser.
 * Numbers and booleans are rig yellow: they are what you rig.
 */
export function highlight(code: string, lang: Lang): ReactNode[] {
  return rows(code, lang).flatMap((row, n) => (n ? ['\n', ...render(row, n)] : render(row, n)));
}

/** One highlighted fragment per line, for views that wrap each line (diffs). */
export function highlightLines(code: string, lang: Lang): ReactNode[][] {
  return rows(code, lang).map((row, n) => render(row, n));
}
