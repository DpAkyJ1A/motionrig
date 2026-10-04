import { st } from './state';
import type { RigConfig } from './types';

type Defaulted = Required<Pick<RigConfig, 'param' | 'storageKey' | 'locale' | 'hotkey'>>;
export type ResolvedConfig = RigConfig & Defaulted;

const DEFAULTS: Defaulted = {
  param: 'rig',
  storageKey: 'motionrig',
  locale: 'en',
  hotkey: 'alt+r',
};

const withDefaults = (c: RigConfig): ResolvedConfig => {
  for (const [k, v] of Object.entries(DEFAULTS)) (c as Record<string, unknown>)[k] ??= v;
  return c as ResolvedConfig;
};

export const getConfig = (): ResolvedConfig => withDefaults(st().config);

/** Shallow merge; an `undefined` option falls back to its default. */
export const setConfig = (options: RigConfig): void => {
  withDefaults(Object.assign(st().config, options));
};
