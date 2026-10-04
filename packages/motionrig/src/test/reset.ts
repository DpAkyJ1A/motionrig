import type { State } from '../core/state';

/**
 * Test-only: forgets the global motionrig state (reached through its symbol, so
 * production code carries no reset hook) and clears what it leaves in the page.
 */
export function resetForTests(): void {
  const g = globalThis as Record<symbol, State | undefined>;
  const key = Symbol.for('motionrig');
  clearTimeout(g[key]?.timer);
  delete g[key];
  if (typeof document === 'undefined') return;
  localStorage.clear();
  sessionStorage.clear();
  history.replaceState(null, '', '/');
  document.adoptedStyleSheets = [];
  document.querySelectorAll('style[data-motionrig]').forEach((el) => el.remove());
}
