import { getConfig } from './config';
import { isLeaf, isPlain, rowOf, table } from './path';
import { st } from './state';
import type { SharePayload, Stored } from './types';

/** Unparseable, foreign or unreachable storage (private mode) all start empty. */
function load(key: string): Stored {
  let d: unknown;
  try {
    d = JSON.parse(localStorage.getItem(key) ?? '');
  } catch {}
  const saved = isPlain(d) && d.v === 1 ? d : {};
  return {
    v: 1,
    overrides: table(saved.overrides, isLeaf),
    baseline: table(saved.baseline, isLeaf),
    // The panel's own state: kept as stored, checked by the panel when it reads it.
    ui: isPlain(saved.ui) ? saved.ui : {},
  };
}

export function store(): Stored {
  const s = st();
  const key = getConfig().storageKey;
  if (!s.store || s.storeKey !== key) {
    flush();
    s.storeKey = key;
    s.store = load(key);
  }
  return s.store;
}

/** Writes a pending change now; `false` when storage refused it. */
export function flush(): boolean {
  const s = st();
  if (s.timer === undefined) return true;
  clearTimeout(s.timer);
  s.timer = undefined;
  try {
    localStorage.setItem(s.storeKey!, JSON.stringify(s.store));
    return true;
  } catch {
    return false;
  }
}

/** Debounced write; a pending one is flushed on `pagehide` or when the tab is hidden. */
export function persist(): void {
  const s = st();
  clearTimeout(s.timer);
  s.timer = setTimeout(flush, 250);
  if (!s.flushOnHide) {
    s.flushOnHide = true;
    addEventListener('pagehide', flush);
    // Mobile browsers may discard a backgrounded tab without ever firing `pagehide`.
    // Listened on window (the event bubbles from document), so registering never touches `document`.
    addEventListener('visibilitychange', () => document.hidden && flush());
  }
}

/** A shared link's values replace stored ones for the listed paths only. */
export function importShare(p: SharePayload): void {
  const { overrides, baseline } = store();
  for (const [id, row] of Object.entries(p.o)) {
    for (const [path, value] of Object.entries(row)) {
      const base = p.b[id]?.[path];
      if (base === undefined) continue;
      rowOf(overrides, id)[path] = value;
      rowOf(baseline, id)[path] = base;
    }
  }
  persist();
}
