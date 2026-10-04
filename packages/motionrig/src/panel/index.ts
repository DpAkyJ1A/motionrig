import { isEnabled } from '../core/gate';
import { Panel } from './element';

const TAG = 'motionrig-panel';

const find = (): Panel | null => document.querySelector<Panel>(TAG);

/** Mounts the one `<motionrig-panel>` (idempotent; nothing while the gate is closed). */
export function mount(): void {
  if (!isEnabled() || find()) return;
  if (!customElements.get(TAG)) customElements.define(TAG, Panel);
  // Mounted from a script in <head> before <body> exists, it still has a home.
  (document.body ?? document.documentElement).append(document.createElement(TAG));
}

/** Mounts if needed and opens on tab `id` (or the last tab). */
export function open(id?: string): void {
  if (!isEnabled()) return;
  mount();
  find()?.show(id);
}
