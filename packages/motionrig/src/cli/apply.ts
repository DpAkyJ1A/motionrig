import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, relative } from 'node:path';
import { safeCss } from '../core/css';
import { printLeaf } from '../core/snippet';
import type { Leaf, SharePayload } from '../core/types';
import { findCssReplacements } from './css-scan';
import { CSS_EXTENSIONS, JS_EXTENSIONS, walk } from './files';
import { resolveInput } from './input';
import type { AppliedChange, CssReport, Report, RigReport, SkippedChange } from './report';
import { hasIssues } from './report';
import { findProperty, findRigMatches, isMemberPath, mentions } from './scan';
import type { RigMatch } from './scan';

export interface ApplyOptions {
  root: string;
  dryRun: boolean;
  force: boolean;
  /** Where a relative `<link | payload | file>` argument is resolved from. Defaults to `process.cwd()` — never `root`, which only scopes source scanning. */
  cwd?: string;
}

export type ApplyResult = { ok: true; report: Report; exitCode: 0 | 1 } | { ok: false; exitCode: 2; message: string };

interface Edit {
  file: string;
  start: number;
  end: number;
  replacement: string;
}

/** 1-based line number of `offset` in `src`, for the ambiguous-match report. */
function lineOf(src: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < src.length; i++) if (src[i] === '\n') line++;
  return line;
}

interface PatchRigOptions {
  id: string;
  file: string;
  overrides: Record<string, Leaf>;
  baseline: Record<string, Leaf> | undefined;
  cEntries: Record<string, string> | undefined;
  match: RigMatch;
  contents: Map<string, string>;
  edits: Edit[];
  force: boolean;
}

function patchRig(opts: PatchRigOptions): Extract<RigReport, { status: 'ok' }> {
  const { id, file, overrides, baseline, cEntries, match, contents, edits, force } = opts;
  const src = contents.get(match.file)!;
  const applied: AppliedChange[] = [];
  const skipped: SkippedChange[] = [];

  for (const path of Object.keys(overrides)) {
    const value = overrides[path]!;
    const prop = findProperty(src, match.objStart, match.objEnd, path.split('.'));

    if (!prop.found) {
      skipped.push({ path, reason: prop.reason });
      continue;
    }
    if (prop.kind === 'unsupported') {
      skipped.push({ path, oldText: prop.raw, reason: prop.reason });
      continue;
    }
    if (prop.kind === 'literal') {
      const base = baseline?.[path];
      if (base !== undefined && prop.value !== base && !force) {
        skipped.push({ path, oldText: prop.raw, reason: 'changed in code since it was tuned' });
        continue;
      }
    }

    const notes = prop.warning ? [prop.warning] : [];
    let replacement = printLeaf(value);
    const cText = cEntries?.[path];
    if (cText !== undefined && isMemberPath(cText)) {
      const name = cText.split('.')[0]!;
      // An identifier the file neither imports nor declares wouldn't compile; the quoted value does.
      if (mentions(src, name, prop.start, prop.end)) replacement = cText;
      else notes.push(`${name} isn't imported in ${file} — wrote ${replacement}`);
    }
    edits.push({ file: match.file, start: prop.start, end: prop.end, replacement });
    applied.push({ path, oldText: prop.raw, newText: replacement, ...(notes.length ? { note: notes.join('; ') } : {}) });
  }

  return { id, status: 'ok', file, applied, skipped };
}

/** The core's `safeCss` (declaration and rule breakouts), plus what only matters in source files:
 *  `//` is a real comment in `.scss`/`.sass`, and any `\` escape, which `css-scan` doesn't model. */
function isUnsafeCssValue(value: string): boolean {
  return !safeCss(value) || /\/\/|\\/.test(value);
}

function applyCss(payload: SharePayload, root: string, edits: Edit[], contents: Map<string, string>): CssReport | undefined {
  const values = new Map<string, string>();
  const skipped: CssReport['skipped'] = [];
  for (const row of Object.values(payload.css ?? {})) {
    for (const [name, value] of Object.entries(row)) {
      if (isUnsafeCssValue(value)) skipped.push({ name, reason: 'unsafe value (could break out of the declaration)' });
      else values.set(name, value);
    }
  }
  if (values.size === 0 && skipped.length === 0) return undefined;

  const found = new Set<string>();
  const applied: CssReport['applied'] = [];
  const files = walk(root, CSS_EXTENSIONS);
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    contents.set(file, src);
    const lineComments = extname(file) !== '.css';
    for (const e of findCssReplacements(src, values, lineComments)) {
      edits.push({ file, start: e.start, end: e.end, replacement: e.value });
      found.add(e.name);
      applied.push({ name: e.name, file: relative(root, file), oldText: src.slice(e.start, e.end), newText: e.value });
    }
  }
  const notFound = [...values.keys()].filter((n) => !found.has(n));
  return { applied, notFound, skipped };
}

function writeEdits(edits: Edit[], contents: Map<string, string>, dryRun: boolean): void {
  const byFile = new Map<string, Edit[]>();
  for (const e of edits) {
    const list = byFile.get(e.file) ?? [];
    list.push(e);
    byFile.set(e.file, list);
  }
  for (const [file, list] of byFile) {
    let src = contents.get(file)!;
    const sorted = [...list].sort((a, b) => b.start - a.start);
    for (const e of sorted) src = src.slice(0, e.start) + e.replacement + src.slice(e.end);
    if (!dryRun) writeFileSync(file, src, 'utf8');
  }
}

/** Implements spec §12: finds every `rig()` call the payload's overrides target, patches only the
 *  overridden value spans, and — for a css rig — every matching `var(--name, fallback)` in a stylesheet. */
export function runApply(input: string, opts: ApplyOptions): ApplyResult {
  const payload = resolveInput(input, opts.cwd ?? process.cwd());
  if (!payload) return { ok: false, exitCode: 2, message: 'Not a motionrig share link, payload or file.' };
  // A typo'd root would otherwise walk nothing and report every rig as "not found".
  if (!statSync(opts.root, { throwIfNoEntry: false })?.isDirectory()) {
    return { ok: false, exitCode: 2, message: `Not a directory: ${opts.root} (--root).` };
  }

  const ids = Object.keys(payload.o);
  const jsFiles = ids.length ? walk(opts.root, JS_EXTENSIONS) : [];
  const contents = new Map<string, string>();
  for (const file of jsFiles) contents.set(file, readFileSync(file, 'utf8'));

  const byId = new Map<string, RigMatch[]>();
  for (const file of jsFiles) {
    for (const m of findRigMatches(file, contents.get(file)!)) {
      const list = byId.get(m.id) ?? [];
      list.push(m);
      byId.set(m.id, list);
    }
  }

  const edits: Edit[] = [];
  const rigs: RigReport[] = [];

  for (const id of ids) {
    const matches = byId.get(id) ?? [];
    if (matches.length === 0) {
      rigs.push({ id, status: 'not-found', applied: [], skipped: [] });
      continue;
    }
    if (matches.length > 1) {
      const at = matches.map((m) => `${relative(opts.root, m.file)}:${lineOf(contents.get(m.file)!, m.callStart)}`);
      rigs.push({ id, status: 'ambiguous', matches: at, applied: [], skipped: [] });
      continue;
    }
    const match = matches[0]!;
    const file = relative(opts.root, match.file);
    rigs.push(
      patchRig({
        id,
        file,
        overrides: payload.o[id]!,
        baseline: payload.b[id],
        cEntries: payload.c?.[id],
        match,
        contents,
        edits,
        force: opts.force,
      }),
    );
  }

  const css = applyCss(payload, opts.root, edits, contents);

  writeEdits(edits, contents, opts.dryRun);

  const report: Report = { rigs, dryRun: opts.dryRun, ...(css ? { css } : {}) };
  return { ok: true, report, exitCode: hasIssues(report) ? 1 : 0 };
}
