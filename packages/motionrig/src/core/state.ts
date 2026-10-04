import type { Entry, RigConfig, Stored } from './types';

export interface State {
  config: RigConfig;
  entries: Map<string, Entry>;
  owners: WeakMap<object, Entry>;
  subs: Map<string, Set<() => void>>;
  registrySubs: Set<() => void>;
  /** Ids whose subscribers run in the next microtask. */
  queue: Set<string>;
  scheduled?: boolean;
  registryChanged?: boolean;
  gate?: boolean;
  /** `configure()` has run: the gate's first computation can commit at once. */
  configured?: boolean;
  /** The gate's side effects (sticky flag, payload import, URL strip) — see gate.ts. */
  commit?: 'pending' | 'done';
  store?: Stored;
  storeKey?: string;
  timer?: ReturnType<typeof setTimeout>;
  flushOnHide?: boolean;
  sheet?: CSSStyleSheet | HTMLStyleElement;
  cssText?: string;
  mounting?: Promise<void>;
  /** Set by a mounted panel: re-reads what it shows from config (theme) after `configure()`. */
  reconfigured?: () => void;
}

const KEY = Symbol.for('motionrig');

/** One registry per page even when the module is bundled twice (e.g. app chunk + panel chunk). */
export function st(): State {
  const g = globalThis as Record<symbol, State | undefined>;
  return (g[KEY] ??= {
    config: {},
    entries: new Map(),
    owners: new WeakMap(),
    subs: new Map(),
    registrySubs: new Set(),
    queue: new Set(),
  });
}
