import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { table, isLeaf } from './path';
import { encodeShare, validateShare } from './payload';
import { configure, rig, setValue } from './registry';
import { buildShare } from './share';
import { store } from './storage';
import { resetForTests } from '../test/reset';

// Untrusted ids and paths named like inherited members must never write through `Object`.
const NAMES = ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf'];
const objectKeys = Object.keys;
const protoNames = () => Object.getOwnPropertyNames(Object.prototype).sort();
const before = protoNames();

beforeEach(resetForTests);
afterEach(() => {
  expect(Object.keys).toBe(objectKeys);
  expect(protoNames()).toEqual(before);
});

/** Raw JSON, so `__proto__` arrives as an own key exactly as `JSON.parse` gives it. */
const crafted = (row: (name: string) => string): string =>
  btoa(`{"v":1,"o":{${row('o')}},"b":{${row('b')}}}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('prototype-named ids and paths', () => {
  it.each(NAMES)('table() drops id and path %s, keeps the rest', (name) => {
    const t = table(JSON.parse(`{"${name}":{"keys":1},"hero":{"${name}":1,"a.${name}":1,"duration":2}}`), isLeaf);
    expect(Object.keys(t)).toEqual(['hero']);
    expect(Object.keys(t.hero!)).toEqual(['duration']);
    expect(t[name]).toBeUndefined();
  });

  it.each(NAMES)('a share link with id %s neither throws nor touches Object, and legit keys still import', (name) => {
    const payload = crafted(
      (side) => `"${name}":{"keys":1,"name":1},"hero":{"${name}":5,"duration":${side === 'o' ? 2 : 1}}`,
    );
    history.replaceState(null, '', `/?rig=${payload}`);
    // Configured first: the gate imports the payload synchronously, as on a real site.
    expect(() => configure({})).not.toThrow();
    const hero = rig('hero', { duration: 1 });
    expect(typeof Object.keys).toBe('function');
    expect(hero.duration).toBe(2);
    expect(Object.keys(store().overrides)).toEqual(['hero']);
    expect(Object.keys(store().overrides.hero!)).toEqual(['duration']);
    // The URL was stripped and marked: a reload doesn't re-run the import.
    expect(location.search).toBe('?rig');
  });

  it('stored overrides with prototype-named keys are dropped on load', () => {
    localStorage.setItem(
      'motionrig',
      '{"v":1,"overrides":{"constructor":{"keys":1},"toString":{"name":1},"__proto__":{"x":1},"hero":{"valueOf":3,"duration":2}},"baseline":{"constructor":{"keys":1},"hero":{"duration":1}},"ui":{}}',
    );
    configure({ enabled: true });
    const hero = rig('hero', { duration: 1 });
    expect(hero.duration).toBe(2);
    expect(Object.keys(store().overrides)).toEqual(['hero']);
  });

  it('a developer-chosen rig id named like a member writes its own row, and Share link stays clean', () => {
    configure({ enabled: true });
    rig('constructor', { keys: 1 });
    rig('toString', { name: 1 });
    setValue('constructor', 'keys', 2);
    setValue('toString', 'name', 3);
    expect(store().overrides.constructor).toEqual({ keys: 2 });
    const p = buildShare();
    expect(p.o.constructor).toEqual({ keys: 2 });
    expect(p.b.toString).toEqual({ name: 1 });
    // Round-trips through the codec: a receiver drops those ids, the rest of Object is untouched.
    expect(validateShare(JSON.parse(JSON.stringify(p)))!.o).toEqual({});
    expect(encodeShare(p)).toBeTypeOf('string');
  });
});
