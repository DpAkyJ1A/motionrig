import { isEnabled } from './core/gate';
import { st } from './core/state';

export { configure, defaultsOf, rig, snapshot, subscribe } from './core/registry';
export { isEnabled };
export type {
  Applies,
  Bezier,
  ControlMeta,
  ControlType,
  EaseDef,
  Flavour,
  Leaf,
  MessageKey,
  Option,
  RigConfig,
  RigMeta,
  RigValues,
} from './core/types';

/** Loads and mounts the panel once, behind the gate; `preload` lets every rig-bearing module register first. */
export function mountPanel(options: { preload?: () => Promise<unknown> } = {}): Promise<void> {
  if (!isEnabled()) return Promise.resolve();
  const s = st();
  return (s.mounting ??= (async () => {
    await options.preload?.();
    (await import('./panel/index')).mount();
  })().catch((err: unknown) => {
    s.mounting = undefined;
    throw err;
  }));
}

export async function openPanel(id?: string): Promise<void> {
  if (!isEnabled()) return;
  await mountPanel();
  (await import('./panel/index')).open(id);
}
