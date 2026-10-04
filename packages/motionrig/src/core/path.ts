import type { Leaf, Table } from './types';

type Obj = Record<string, unknown>;

export const isPlain = (v: unknown): v is Obj => {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

export const isLeaf = (v: unknown): v is Leaf =>
  typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean';

export const getPath = (obj: object, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (isPlain(o) ? o[k] : undefined), obj);

/** Writes into the existing nested objects so outside references to them stay live. */
export function setPath(obj: object, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  const parent = keys.length ? getPath(obj, keys.join('.')) : obj;
  if (isPlain(parent)) parent[last] = value;
}

export function leaves(obj: object, prefix = ''): [string, Leaf][] {
  const out: [string, Leaf][] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix + k;
    if (isPlain(v)) out.push(...leaves(v, path + '.'));
    else if (isLeaf(v)) out.push([path, v]);
  }
  return out;
}

/** Deep, frozen copy of plain objects; anything else is kept by reference. */
export function clone<T>(v: T): T {
  if (!isPlain(v)) return v;
  const out: Obj = {};
  for (const k of Object.keys(v)) out[k] = clone(v[k]);
  return Object.freeze(out) as T;
}

/** Prototype-less, so an id or path such as `constructor` can never reach `Object`'s members. */
export const dict = <V>(): Record<string, V> => Object.create(null);

/** The row of `id`, created on first write. */
export const rowOf = <V>(t: Table<V>, id: string): Record<string, V> => (t[id] ??= dict());

/** `constructor`, `toString`, `__proto__`…: named like inherited members, so never taken from untrusted input. */
const unsafe = (key: string): boolean => key.split('.').some((k) => k in Object.prototype);

/** Validates an `id → path → value` table from untrusted JSON, dropping invalid parts. */
export function table<V>(raw: unknown, ok: (v: unknown) => v is V): Table<V> {
  const out = dict<Record<string, V>>();
  if (!isPlain(raw)) return out;
  for (const [id, row] of Object.entries(raw)) {
    if (!isPlain(row) || unsafe(id)) continue;
    const clean = dict<V>();
    for (const [path, v] of Object.entries(row)) if (ok(v) && !unsafe(path)) clean[path] = v;
    if (Object.keys(clean).length) out[id] = clean;
  }
  return out;
}
