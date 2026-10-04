import { getConfig } from './config';
import { notify } from './notify';
import { refresh } from './overrides';
import { decodeShare } from './payload';
import { st } from './state';
import { flush, importShare } from './storage';
import type { SharePayload } from './types';

interface Verdict {
  open: boolean;
  /** Write (`true`) or clear (`false`) the sticky flag; untouched when absent. */
  sticky?: boolean;
  payload?: SharePayload | undefined;
  /** The param's text, which identifies the payload. */
  raw?: string | null;
}

/** Reads `key`, or writes it (`null` removes). Blocked storage (private mode) reads as absent. */
function session(key: string, value?: string | null): string | null {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {}
  return null;
}

/**
 * Leaves a bare `?<param>` (other params and the hash kept) while the URL still shows `raw`.
 * The state goes without Next's `__NA` / `_N` marks: the App Router's patched `replaceState`
 * then adopts the new URL (and copies its own marks back) instead of treating it as its own.
 */
function strip(param: string, raw: string): void {
  if (new URLSearchParams(location.search).get(param) !== raw) return;
  const query = location.search
    .slice(1)
    .split('&')
    .map((kv) => (kv.split('=')[0] === param ? param : kv))
    .join('&');
  const state = { ...history.state };
  delete state.__NA;
  delete state._N;
  try {
    history.replaceState(state, '', `?${query}${location.hash}`);
  } catch {}
}

/**
 * Strips now, then re-checks for 10 s: Next's App Router hydrates with the URL it was served
 * (payload included) and writes it back once; the re-strip after that goes through its patch and sticks.
 */
function stripSoon(param: string, raw: string): void {
  strip(param, raw);
  const timer = setInterval(() => strip(param, raw), 250);
  setTimeout(() => clearInterval(timer), 10_000);
}

/** §7 as a pure read of config, URL and the sticky flag. */
function read(): Verdict {
  if (typeof window === 'undefined') return { open: false };
  const { enabled, param, storageKey } = getConfig();
  if (enabled === false) return { open: false };
  const value = new URLSearchParams(location.search).get(param);
  const payload = value === null ? undefined : decodeShare(value);
  if (enabled) return { open: true, payload, raw: value };
  if (value === null) return { open: session(storageKey + ':on') === '1' };
  if (/^(off|0|false)$/.test(value)) return { open: false, sticky: false };
  return { open: true, sticky: true, payload, raw: value };
}

const hasEffects = (v: Verdict): boolean => v.sticky !== undefined || !!v.payload;

/**
 * Commits the side effects, re-reading with the config of that moment. Deferred one
 * microtask when nothing was configured yet, so a `configure()` later in the same
 * tick decides them. Effects are committed once per page.
 */
function commit(): void {
  const s = st();
  const v = read();
  s.commit = hasEffects(v) ? 'done' : undefined;
  const { param, storageKey } = getConfig();
  if (v.sticky !== undefined) session(storageKey + ':on', v.sticky ? '1' : null);
  if (!v.payload) return;
  // Once per tab and payload: Next's App Router keeps re-writing the URL it captured,
  // payload included, and a reload must not import it over the designer's later tweaks.
  const imported = storageKey + ':imported';
  if (session(imported) !== v.raw) {
    importShare(v.payload);
    // Marked only once stored: after a refused write, the next load must import it again.
    if (flush()) session(imported, v.raw!);
    if (s.gate) refresh();
    notify();
  }
  stripSoon(param, v.raw!);
}

export function isEnabled(): boolean {
  const s = st();
  if (s.gate === undefined) {
    const v = read();
    s.gate = v.open;
    if (!s.commit && hasEffects(v)) {
      // Configured first: nothing left to wait for, so a link's values land before any layout effect.
      if (s.configured) commit();
      else {
        s.commit = 'pending';
        queueMicrotask(commit);
      }
    }
  }
  return s.gate;
}
