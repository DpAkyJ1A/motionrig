import { beforeEach, describe, expect, it } from 'vitest';
import { getConfig, setConfig } from './config';
import { st } from './state';
import { resetForTests } from '../test/reset';

beforeEach(resetForTests);

describe('config', () => {
  it('has defaults', () => {
    expect(getConfig()).toEqual({ param: 'rig', storageKey: 'motionrig', locale: 'en', hotkey: 'alt+r' });
  });

  it('merges options and falls back to defaults for undefined ones', () => {
    setConfig({ param: 'tune', locale: 'ru' });
    setConfig({ hotkey: false, param: undefined, eases: { a: [0, 0, 1, 1] } });
    expect(getConfig()).toMatchObject({ param: 'rig', locale: 'ru', hotkey: false, eases: { a: [0, 0, 1, 1] } });
  });
});

describe('state', () => {
  it('lives on globalThis under Symbol.for("motionrig"), so a duplicated module shares it', () => {
    const s = st();
    expect((globalThis as Record<symbol, unknown>)[Symbol.for('motionrig')]).toBe(s);
    expect(st()).toBe(s);
  });
});
