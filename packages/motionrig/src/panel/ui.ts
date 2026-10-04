import { isPlain } from '../core/path';
import { persist, store } from '../core/storage';
import type { UiState } from '../core/types';

const point = (p: unknown): UiState['ring'] =>
  isPlain(p) && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x as number, y: p.y as number } : undefined;

/** Keeps only well-formed ui fields; the panel reads them without further checks. */
function uiOf(raw: Record<string, unknown>): UiState {
  const ui: UiState = {};
  const { open, tab, seen } = raw;
  if (typeof open === 'boolean') ui.open = open;
  if (raw.allTabs === true) ui.allTabs = true;
  if (typeof tab === 'string') ui.tab = tab;
  const ring = point(raw.ring);
  const panel = point(raw.panel);
  if (ring) ui.ring = ring;
  if (panel) ui.panel = panel;
  if (Array.isArray(seen) && seen.every((id) => typeof id === 'string')) ui.seen = seen;
  return ui;
}

/** Stores already checked; a `storageKey` swap loads a new one. */
const checked = new WeakSet<object>();

/** Checked here, not in the core: only the panel reads it, so the page's own bundle stays small. */
export function ui(): UiState {
  const s = store();
  if (!checked.has(s.ui)) {
    s.ui = uiOf(s.ui) as Record<string, unknown>;
    checked.add(s.ui);
  }
  return s.ui as UiState;
}

export function setUi(patch: Partial<UiState>): void {
  Object.assign(ui(), patch);
  persist();
}
