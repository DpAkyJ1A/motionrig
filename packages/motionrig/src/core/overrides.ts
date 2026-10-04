import { syncCss } from './css';
import { notify } from './notify';
import { clone, getPath, isLeaf, leaves, setPath } from './path';
import { st } from './state';
import { persist, store } from './storage';
import type { Entry } from './types';

/** Code defaults, cloned lazily — every mutation path takes it before writing. */
export const defaults = (e: Entry): object => (e.defaults ??= clone(e.values));

export function tidy(id: string): void {
  const { overrides, baseline } = store();
  if (Object.keys(overrides[id] ?? {}).length) return;
  delete overrides[id];
  delete baseline[id];
}

/**
 * Applies stored overrides to `e`. "Code wins": an override only applies while the
 * code default is still the one it was tuned against; otherwise it is dropped.
 * Returns whether a live value changed.
 */
export function apply(e: Entry): boolean {
  const { overrides, baseline } = store();
  const o = overrides[e.id];
  if (!o) return false;
  const d = defaults(e);
  let wrote = false;
  let dropped = false;
  for (const [path, value] of Object.entries(o)) {
    const def = getPath(d, path);
    // Stored and shared values are untrusted: the type must match the code default.
    if (isLeaf(def) && typeof value === typeof def && baseline[e.id]?.[path] === def) {
      if (getPath(e.values, path) !== value) {
        setPath(e.values, path, value);
        wrote = true;
      }
    } else {
      delete o[path];
      delete baseline[e.id]?.[path];
      dropped = true;
    }
  }
  if (dropped) {
    tidy(e.id);
    persist();
  }
  return wrote;
}

/** Applies stored overrides to every registered rig, notifying the ones that changed. */
export function refresh(): void {
  for (const e of st().entries.values()) {
    if (apply(e)) {
      e.version++;
      notify(e.id);
    }
  }
  syncCss();
}

/** Puts every registered rig back to its code defaults, in place (nested objects keep their identity). */
export function restoreDefaults(): void {
  for (const e of st().entries.values()) {
    if (!e.defaults) continue;
    let changed = false;
    for (const [path, def] of leaves(e.defaults)) {
      if (getPath(e.values, path) === def) continue;
      setPath(e.values, path, def);
      changed = true;
    }
    if (changed) {
      e.version++;
      notify(e.id);
    }
  }
}
