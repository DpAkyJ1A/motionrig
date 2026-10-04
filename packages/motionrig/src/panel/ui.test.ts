import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configure } from '../core/registry';
import { store } from '../core/storage';
import { resetForTests } from '../test/reset';
import { setUi, ui } from './ui';

beforeEach(resetForTests);
afterEach(() => {
  vi.useRealTimers();
});

const saved = (key = 'motionrig') => JSON.parse(localStorage.getItem(key) ?? 'null');
const stored = (value: unknown, key = 'motionrig') =>
  localStorage.setItem(key, JSON.stringify({ v: 1, overrides: {}, baseline: {}, ui: value }));

describe('ui state (the panel checks what the core keeps as stored)', () => {
  it('keeps only well-formed fields', () => {
    const good = { open: false, tab: 'hero', ring: { x: 16, y: 700 }, panel: { x: 24, y: 80 }, seen: ['hero', 'faq'] };
    stored(good);
    expect(ui()).toEqual(good);

    resetForTests();
    stored({ open: 'yes', tab: 3, ring: { x: 1, y: 'a' }, panel: { x: 24, y: 80, z: 1 }, seen: ['a', 2], extra: 1 });
    expect(ui()).toEqual({ panel: { x: 24, y: 80 } });
    // Checked once, in place: what gets written back is the clean state.
    expect(store().ui).toBe(ui());

    resetForTests();
    stored({ ring: null, seen: 'a' });
    expect(ui()).toEqual({});
  });

  it('a storageKey swap brings in a new store, which is checked too', () => {
    stored({ tab: 'a' });
    expect(ui()).toEqual({ tab: 'a' });
    stored({ tab: 7, open: true }, 'site');
    configure({ storageKey: 'site' });
    expect(ui()).toEqual({ open: true });
  });

  it('merges patches and persists them', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    setUi({ open: true, tab: 'hero' });
    setUi({ ring: { x: 16, y: 700 } });
    expect(ui()).toEqual({ open: true, tab: 'hero', ring: { x: 16, y: 700 } });
    vi.advanceTimersByTime(250);
    expect(saved().ui).toEqual({ open: true, tab: 'hero', ring: { x: 16, y: 700 } });
  });
});
