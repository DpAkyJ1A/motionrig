// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { findRigCalls } from './calls';

describe('findRigCalls — real-world shapes', () => {
  it('finds the call after JSX text containing an apostrophe on an earlier line', () => {
    const src = `export function Intro() {\n  return <p>Don't blink</p>;\n}\nexport const HERO = rig('hero', { duration: 1 });\n`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  it('finds a call before JSX text and ignores a commented-out one after it', () => {
    const src = `export const HERO = rig('hero', { duration: 1 });\nexport function Intro() {\n  return <p>Don't blink</p>;\n}\n// don't use rig('hero', { duration: 9 }) here\n`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  it('matches rig<T>(id, {...}) with explicit type arguments', () => {
    const src = `rig<Cfg>('gen', { a: 1 });`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  it('matches rig<Nested<T>>(id, {...}) with nested type arguments', () => {
    const src = `rig<Record<'a', 1>>('gen', { a: 1 });`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  it('does not hang or misfire on a stray unmatched "<" before rig(', () => {
    const src = `const cmp = a < b;\nrig('x', { a: 1 });`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  // A `;` inside an object type literal is valid TS and must not abort the scan.
  it('matches rig<{ a: number; b: string }>(id, {...})', () => {
    const src = `rig<{ a: number; b: string }>('semi', { a: 1 });`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  // An arrow function type's `=>` must not be mistaken for a closing `>`.
  it('matches rig<Foo<() => void>>(id, {...})', () => {
    const src = `rig<Foo<() => void>>('arrow', { a: 1 });`;
    expect(findRigCalls(src)).toHaveLength(1);
  });

  // Callers need the position of the `rig(` token itself (for ambiguous file:line
  // reporting), not just the paren: each match reports both.
  it('reports both the paren position and the identifier start', () => {
    const src = `  rig('hero', { a: 1 });`;
    const [m] = findRigCalls(src);
    expect(m).toBeDefined();
    expect(src[m!.paren]).toBe('(');
    expect(src.slice(m!.start, m!.start + 3)).toBe('rig');
    expect(m!.start).toBeLessThan(m!.paren);
  });
});
