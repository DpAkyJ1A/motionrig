import { getConfig } from './config';
import { cssValue, cssVar, safeCss } from './css';
import { controlAt } from './infer';
import { dict, rowOf } from './path';
import { encodeShare } from './payload';
import { getEntry } from './registry';
import { codeOf } from './snippet';
import { store } from './storage';
import type { SharePayload } from './types';

/** Stored overrides of every id (registered on this page or not), with baselines and source hints. */
export function buildShare(): SharePayload {
  const { overrides, baseline } = store();
  const p: SharePayload = { v: 1, o: dict(), b: dict() };
  for (const [id, row] of Object.entries(overrides)) {
    const e = getEntry(id);
    for (const [path, value] of Object.entries(row)) {
      const base = baseline[id]?.[path];
      if (base === undefined) continue;
      rowOf(p.o, id)[path] = value;
      rowOf(p.b, id)[path] = base;
      const code = codeOf(value, e && controlAt(e, path));
      if (code) rowOf((p.c ??= dict()), id)[path] = code;
      // Only rigs registered on this page: var names and units live in their meta.
      if (e?.meta.css && safeCss(value)) rowOf((p.css ??= dict()), id)[cssVar(e, path)] = cssValue(e, path, value);
    }
  }
  return p;
}

/** The current URL with `?<param>=<payload>`; other params and the hash are kept. */
export function shareUrl(p: SharePayload = buildShare()): string {
  const url = new URL(location.href);
  url.searchParams.set(getConfig().param, encodeShare(p));
  return url.href;
}
