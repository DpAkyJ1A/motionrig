import { getConfig, setConfig } from './config';
import { syncCss } from './css';
import { isEnabled } from './gate';
import { notify, onRegistryChange, subscribeEntry } from './notify';
import { apply, defaults, refresh, restoreDefaults, tidy } from './overrides';
import { clone, getPath, isLeaf, rowOf, setPath } from './path';
import { st } from './state';
import { persist, store } from './storage';
import type { Entry, Leaf, RigConfig, RigMeta } from './types';

// Re-exported so the panel reaches every §4.2 operation through this module.
export { defaults, onRegistryChange, subscribeEntry };

function changed(e: Entry): void {
  e.version++;
  if (e.meta.css) syncCss();
  notify(e.id);
  persist();
}

export function rig<T extends object>(id: string, values: T, meta: RigMeta<T> = {}): T {
  if (typeof window === 'undefined') return values;
  const s = st();
  const prev = s.entries.get(id);
  const hadCss = prev?.meta.css;
  if (prev?.values === values) {
    // The same object again (a re-run module): its defaults and overrides stand, the meta is new.
    prev.meta = meta;
    prev.controls = prev.controlMap = undefined;
  } else {
    const e: Entry = { id, values, meta, version: 0 };
    s.entries.set(id, e);
    s.owners.set(values, e);
    if (isEnabled()) apply(e);
  }
  if (isEnabled()) {
    if (meta.css || hadCss) syncCss();
    notify();
  }
  return values;
}

/**
 * Merges config and re-evaluates the gate. Closing an open gate or switching
 * `storageKey` first puts every rig back to its code defaults, so the new state
 * never stacks on overrides applied under the old one.
 */
export function configure(options: RigConfig): void {
  const s = st();
  // Only the panel reads `theme`: re-reading the gate for it would be a second URL / storage read.
  const keys = Object.keys(options);
  if (keys.length && keys.every((k) => k === 'theme')) {
    setConfig(options);
    return s.reconfigured?.();
  }
  const wasOpen = s.gate;
  const key = getConfig().storageKey;
  setConfig(options);
  s.configured = true;
  s.gate = undefined;
  const open = isEnabled();
  const swapped = getConfig().storageKey !== key;
  if ((wasOpen && !open) || swapped) restoreDefaults();
  if (open) refresh();
  else syncCss();
  // The panel re-reads gate, marks and badge on registry notifications, even when no value changed.
  if ((wasOpen !== undefined && wasOpen !== open) || swapped) notify();
  s.reconfigured?.();
}

const known = (values: object): Entry | undefined =>
  isEnabled() ? st().owners.get(values) : undefined;

export function subscribe(values: object, listener: () => void): () => void {
  const e = known(values);
  return e ? subscribeEntry(e.id, listener) : () => {};
}

export function snapshot<T extends object>(values: T): T {
  const e = known(values);
  if (!e) return values;
  if (e.snapVersion !== e.version) {
    e.snap = clone(values);
    e.snapVersion = e.version;
  }
  return e.snap as T;
}

export function defaultsOf<T extends object>(values: T): T {
  const e = known(values);
  return e ? (defaults(e) as T) : values;
}

// Internal operations (§4.2), used by the panel.

export const entries = (): Entry[] => [...st().entries.values()];
export const getEntry = (id: string): Entry | undefined => st().entries.get(id);

export function setValue(id: string, path: string, value: Leaf): void {
  const e = getEntry(id);
  if (!e) return;
  const def = getPath(defaults(e), path);
  if (!isLeaf(def) || typeof value !== typeof def || getPath(e.values, path) === value) return;
  setPath(e.values, path, value);
  const { overrides, baseline } = store();
  if (value === def) {
    delete overrides[id]?.[path];
    delete baseline[id]?.[path];
    tidy(id);
  } else {
    rowOf(overrides, id)[path] = value;
    rowOf(baseline, id)[path] = def;
  }
  changed(e);
}

export function resetValue(id: string, path: string): void {
  const e = getEntry(id);
  const def = e && getPath(defaults(e), path);
  if (isLeaf(def)) setValue(id, path, def);
}

/** Also clears stored overrides of an id that isn't registered on this page. */
export function resetEntry(id: string): void {
  const { overrides, baseline } = store();
  const o = overrides[id];
  if (!o) return;
  delete overrides[id];
  delete baseline[id];
  // Values reset: registry listeners hear it once, whether the rig is on this page or not.
  notify();
  const e = getEntry(id);
  if (!e) return persist();
  const d = defaults(e);
  for (const path of Object.keys(o)) setPath(e.values, path, getPath(d, path));
  changed(e);
}

export function resetAll(): void {
  for (const id of Object.keys(store().overrides)) resetEntry(id);
}

/** Path → value of the paths that differ from the code default. */
export const overridesOf = (id: string): Record<string, Leaf> => ({ ...store().overrides[id] });

/** Stored overrides across all ids, registered on this page or not. */
export const changedCount = (): number =>
  Object.values(store().overrides).reduce((n, o) => n + Object.keys(o).length, 0);
