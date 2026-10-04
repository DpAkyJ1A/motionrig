import { describe, expect, it } from 'vitest';
import { clone, getPath, isLeaf, isPlain, leaves, setPath, table } from './path';

describe('getPath / setPath', () => {
  it('reads top-level and nested paths', () => {
    const o = { a: 1, b: { c: { d: 'x' } } };
    expect(getPath(o, 'a')).toBe(1);
    expect(getPath(o, 'b.c.d')).toBe('x');
    expect(getPath(o, 'b.nope.d')).toBeUndefined();
  });

  it('writes nested values in place, keeping nested references live', () => {
    const o = { b: { c: 1 } };
    const nested = o.b;
    setPath(o, 'b.c', 2);
    expect(nested.c).toBe(2);
    expect(o.b).toBe(nested);
  });

  it('ignores a path whose parent does not exist', () => {
    const o = { a: 1 };
    setPath(o, 'x.y', 2);
    expect(o).toEqual({ a: 1 });
  });
});

describe('leaves', () => {
  it('lists supported leaves depth-first in key order, skipping everything else', () => {
    const fn = () => {};
    const o = { a: 1, n: null, b: { c: 'x', arr: [1], d: { e: true } }, f: fn, g: 2 };
    expect(leaves(o)).toEqual([
      ['a', 1],
      ['b.c', 'x'],
      ['b.d.e', true],
      ['g', 2],
    ]);
  });
});

describe('clone', () => {
  it('deep-copies plain objects, frozen, and keeps other values by reference', () => {
    const arr = [1, 2];
    const o = { a: 1, b: { c: 2 }, arr };
    const c = clone(o);
    expect(c).toEqual(o);
    expect(c).not.toBe(o);
    expect(c.b).not.toBe(o.b);
    expect(c.arr).toBe(arr);
    expect(Object.isFrozen(c)).toBe(true);
    expect(Object.isFrozen(c.b)).toBe(true);
    expect(Object.isFrozen(arr)).toBe(false);
  });
});

describe('predicates', () => {
  it('isPlain accepts object literals and null-prototype objects only', () => {
    expect(isPlain({})).toBe(true);
    expect(isPlain(Object.create(null))).toBe(true);
    expect(isPlain(null)).toBe(false);
    expect(isPlain([])).toBe(false);
    expect(isPlain(new Date())).toBe(false);
    expect(isPlain(0)).toBe(false);
  });

  it('isLeaf accepts number / string / boolean', () => {
    expect([1, 'a', false].every(isLeaf)).toBe(true);
    expect([null, undefined, {}, [], () => {}].some(isLeaf)).toBe(false);
  });
});

describe('table', () => {
  it('keeps valid id → path → value entries and drops the rest', () => {
    const raw = { a: { x: 1, y: {}, z: 'ok' }, b: 3, c: { bad: null }, d: [] };
    expect(table(raw, isLeaf)).toEqual({ a: { x: 1, z: 'ok' } });
    expect(table('nope', isLeaf)).toEqual({});
  });
});
