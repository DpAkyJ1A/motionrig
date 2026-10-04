// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeShare } from '../core/payload';
import type { SharePayload } from '../core/types';
import { runApply } from './apply';
import type { ApplyResult } from './apply';
import type { Report } from './report';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'motionrig-apply-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const write = async (rel: string, content: string) => {
  const p = join(dir, rel);
  await mkdir(join(p, '..'), { recursive: true });
  await writeFile(p, content);
  return p;
};

/** Asserts success and narrows the type, so a bug that flips `ok` to false fails loudly
 *  instead of silently skipping the rest of the test. */
function expectOk(result: ApplyResult): { report: Report; exitCode: 0 | 1 } {
  if (!result.ok) throw new Error(`expected ok, got failure: ${result.message}`);
  return result;
}

function expectFail(result: ApplyResult): { exitCode: 2; message: string } {
  if (result.ok) throw new Error('expected a failure, got ok');
  return result;
}

describe('runApply — finding calls', () => {
  it('finds the call regardless of quote style used for the id', async () => {
    await write('a.ts', `rig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
  });

  it('finds the call through apply for each of the three quote styles', async () => {
    await write('a.ts', `rig('single', { a: 1 });\nrig("double", { a: 1 });\nrig(\`backtick\`, { a: 1 });\n`);
    const payload: SharePayload = {
      v: 1,
      o: { single: { a: 2 }, double: { a: 3 }, backtick: { a: 4 } },
      b: {},
    };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(report.rigs.every((r) => r.status === 'ok')).toBe(true);
    const text = await readFile(join(dir, 'a.ts'), 'utf8');
    expect(text).toBe(`rig('single', { a: 2 });\nrig("double", { a: 3 });\nrig(\`backtick\`, { a: 4 });\n`);
  });

  it('ignores matches inside comments and strings', async () => {
    await write('a.ts', `// rig('hero', { duration: 9 })\nconst s = "rig('hero', {})";\nrig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const text = await readFile(join(dir, 'a.ts'), 'utf8');
    expect(text).toContain('duration: 1.2');
    expect(text).toContain(`// rig('hero', { duration: 9 })`);
  });

  // An apostrophe in JSX text before the real call must not swallow it.
  it('finds a rig() call after JSX text containing an apostrophe', async () => {
    await write(
      'A.tsx',
      `export function Intro() {\n  return <p>Don't blink</p>;\n}\nexport const HERO = rig('hero', { duration: 1 });\n`,
    );
    const payload: SharePayload = { v: 1, o: { hero: { duration: 2 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'A.tsx'), 'utf8')).toContain('duration: 2');
  });

  // JSX text with an apostrophe after the real call, plus a commented-out rig() with the
  // same id — the real call must still be the only match (not ambiguous, not corrupted).
  it('ignores a commented-out rig() after JSX text with an apostrophe', async () => {
    await write(
      'A.tsx',
      `export const HERO = rig('hero', { duration: 1 });\nexport function Intro() {\n  return <p>Don't blink</p>;\n}\n// don't use rig('hero', { duration: 9 }) here\n`,
    );
    const payload: SharePayload = { v: 1, o: { hero: { duration: 2 } }, b: {} };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(report.rigs[0]?.status).toBe('ok');
    const text = await readFile(join(dir, 'A.tsx'), 'utf8');
    expect(text).toContain('duration: 2');
    expect(text).toContain(`// don't use rig('hero', { duration: 9 }) here`);
  });

  // Rig<T>('id', {...}) with explicit type arguments.
  it('finds a call with explicit type arguments: rig<Cfg>(...)', async () => {
    await write('a.ts', `rig<Cfg>('gen', { a: 1 });`);
    const payload: SharePayload = { v: 1, o: { gen: { a: 2 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig<Cfg>('gen', { a: 2 });`);
  });
});

describe('runApply — nested paths, suffixes, identifiers', () => {
  it('patches a nested path into a nested object literal', async () => {
    await write('a.ts', `rig('shutter', {\n  enter: {\n    rows: 12,\n  },\n});`);
    const payload: SharePayload = { v: 1, o: { shutter: { 'enter.rows': 20 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toContain('rows: 20');
  });

  it('keeps an `as` suffix and only replaces the literal', async () => {
    await write('a.ts', `rig('curtain', {\n  variant: 'arc' as CurtainVariant,\n});`);
    const payload: SharePayload = { v: 1, o: { curtain: { variant: 'wipe' } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toContain(`variant: 'wipe' as CurtainVariant,`);
  });

  it('replaces an identifier value and reports the old text', async () => {
    await write('a.ts', `import { EASE_REVEAL, EASE_SOFT } from './eases';\nrig('hero', {\n  ease: EASE_REVEAL, // comment\n});`);
    const payload: SharePayload = { v: 1, o: { hero: { ease: '0.4,0,1,1' } }, b: {}, c: { hero: { ease: 'EASE_SOFT' } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const rig = report.rigs[0];
    expect(rig?.status).toBe('ok');
    if (rig?.status !== 'ok') throw new Error('expected ok status');
    expect(rig.applied[0]).toMatchObject({ path: 'ease', oldText: 'EASE_REVEAL', newText: 'EASE_SOFT' });
    const text = await readFile(join(dir, 'a.ts'), 'utf8');
    expect(text).toContain('ease: EASE_SOFT, // comment');
  });

  describe('a `c` identifier the file has no binding for', () => {
    const flow: SharePayload = { v: 1, o: { grid: { ease: 'flowEase' } }, b: { grid: { ease: 'expo.out' } }, c: { grid: { ease: 'EASE_FLOW' } } };
    const run = () => expectOk(runApply(encodeShare(flow), { root: dir, dryRun: false, force: false }));

    it.each([
      ['imported', `import { EASE_FLOW } from '@/motion';\n`],
      ['declared', `const EASE_FLOW = 'flowEase';\n`],
      ['imported under its namespace root', `import * as EASE_FLOW from './x';\n`],
    ])('writes the identifier when it is %s', async (_, head) => {
      await write('grid.ts', `${head}rig('grid', { ease: 'expo.out' });`);
      const { exitCode, report } = run();
      expect(exitCode).toBe(0);
      const r = report.rigs[0];
      if (r?.status !== 'ok') throw new Error('expected ok status');
      expect(r.applied[0]).toEqual({ path: 'ease', oldText: "'expo.out'", newText: 'EASE_FLOW' });
      expect(await readFile(join(dir, 'grid.ts'), 'utf8')).toBe(`${head}rig('grid', { ease: EASE_FLOW });`);
    });

    it.each([
      ['nowhere', ''],
      ['only in a comment', '// EASE_FLOW is the house curve\n/* EASE_FLOW */\n'],
      ['only in a string or template', `const s = 'EASE_FLOW', t = \`EASE_FLOW\`;\n`],
      ['only as a member of something else', 'const x = eases.EASE_FLOW;\n'],
    ])('writes the quoted ease name, with a note, when it appears %s', async (_, head) => {
      await write('grid.ts', `import { rig } from 'motionrig';\n${head}rig('grid', { ease: 'expo.out' });`);
      const { exitCode, report } = run();
      expect(exitCode).toBe(0);
      const r = report.rigs[0];
      if (r?.status !== 'ok') throw new Error('expected ok status');
      expect(r.applied[0]).toEqual({
        path: 'ease',
        oldText: "'expo.out'",
        newText: "'flowEase'",
        note: "EASE_FLOW isn't imported in grid.ts — wrote 'flowEase'",
      });
      expect(await readFile(join(dir, 'grid.ts'), 'utf8')).toBe(
        `import { rig } from 'motionrig';\n${head}rig('grid', { ease: 'flowEase' });`,
      );
    });

    it('does not count the patched value itself as a binding', async () => {
      await write('grid.ts', `rig('grid', { ease: EASE_FLOW });`);
      const { report } = expectOk(runApply(encodeShare({ ...flow, b: {} }), { root: dir, dryRun: true, force: false }));
      const r = report.rigs[0];
      if (r?.status !== 'ok') throw new Error('expected ok status');
      expect(r.applied[0]).toMatchObject({ newText: "'flowEase'" });
    });
  });

  it('falls back to printLeaf when a `c` entry is not a bare identifier/member expression', async () => {
    await write('a.ts', `rig('hero', { ease: OLD });`);
    const payload: SharePayload = {
      v: 1,
      o: { hero: { ease: '0.4,0,1,1' } },
      b: {},
      c: { hero: { ease: "'; process.exit(1); //" } },
    };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const text = await readFile(join(dir, 'a.ts'), 'utf8');
    expect(text).toContain(`ease: '0.4,0,1,1'`);
  });

  // Numeric keys, spread/computed-specific "not found" reason, and the shadow warning.
  it('patches a numeric-literal key', async () => {
    await write('a.ts', `rig('x', { 1: 0.5, other: 2 });`);
    const payload: SharePayload = { v: 1, o: { x: { '1': 0.9 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('x', { 1: 0.9, other: 2 });`);
  });

  it('accepts a leading-dot number literal (.5)', async () => {
    await write('a.ts', `rig('x', { half: .5 });`);
    const payload: SharePayload = { v: 1, o: { x: { half: 0.75 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('x', { half: 0.75 });`);
  });

  it('reports a spread/computed-specific reason when a path is missing because of one', async () => {
    await write('a.ts', `rig('x', { ...BASE, other: 1 });`);
    const payload: SharePayload = { v: 1, o: { x: { missing: 1 } }, b: {} };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    const rig = report.rigs[0];
    if (rig?.status !== 'ok') throw new Error('expected ok status (with a skipped path)');
    expect(rig.skipped[0]?.reason).toMatch(/spread\/computed/);
  });

  it('still patches a literal key shadowed by a later spread, with a warning', async () => {
    await write('a.ts', `rig('x', { label: 'a', ...OVERRIDES });`);
    const payload: SharePayload = { v: 1, o: { x: { label: 'b' } }, b: {} };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const rig = report.rigs[0];
    if (rig?.status !== 'ok') throw new Error('expected ok status');
    expect(rig.applied[0]?.note).toMatch(/shadowed/);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('x', { label: 'b', ...OVERRIDES });`);
  });
});

describe('runApply — baseline guard', () => {
  it('skips a path whose current value differs from the baseline it was tuned against', async () => {
    await write('a.ts', `rig('hero', { duration: 5 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: { hero: { duration: 1 } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    const rig = report.rigs[0];
    if (rig?.status !== 'ok') throw new Error('expected ok status');
    expect(rig.skipped).toHaveLength(1);
    expect(rig.skipped[0]?.reason).toMatch(/changed in code/);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 5 });`);
  });

  it('applies a baseline mismatch anyway with --force', async () => {
    await write('a.ts', `rig('hero', { duration: 5 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: { hero: { duration: 1 } } };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: true }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
  });

  it('applies without a baseline check when there is no baseline for the path', async () => {
    await write('a.ts', `rig('hero', { duration: 5 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
  });
});

describe('runApply — dry run', () => {
  it('writes nothing but still reports what would change', async () => {
    const original = `rig('hero', { duration: 1 });`;
    await write('a.ts', original);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: true, force: false }));
    expect(exitCode).toBe(0);
    expect(report.dryRun).toBe(true);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(original);
  });
});

describe('runApply — not found / ambiguous', () => {
  it('reports "not found" and exit code 1 for an id with no matching call', async () => {
    await write('a.ts', `rig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { faq: { duration: 1.2 } }, b: {} };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    expect(report.rigs[0]?.status).toBe('not-found');
  });

  it('reports "ambiguous" (with file:line for each match) and exit code 1', async () => {
    await write('a.ts', `rig('hero', { duration: 1 });`);
    await write('b.ts', `\n\nrig('hero', { duration: 2 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    const rig = report.rigs[0];
    expect(rig?.status).toBe('ambiguous');
    if (rig?.status !== 'ambiguous') throw new Error('expected ambiguous status');
    expect(rig.matches).toEqual(expect.arrayContaining([expect.stringMatching(/^a\.ts:1$/), expect.stringMatching(/^b\.ts:3$/)]));
    // neither file was touched
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1 });`);
    expect(await readFile(join(dir, 'b.ts'), 'utf8')).toBe(`\n\nrig('hero', { duration: 2 });`);
  });

  // When the object literal starts on a later line than the `rig(` call itself, the
  // report must cite the call's own line, not the `{`'s.
  it('reports the line of the `rig(` token itself, not of its object literal', async () => {
    await write('a.ts', `rig(\n  'hero',\n  { duration: 1 },\n);`);
    await write('b.ts', `rig('hero', { duration: 2 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    const rig = report.rigs[0];
    if (rig?.status !== 'ambiguous') throw new Error('expected ambiguous status');
    expect(rig.matches).toEqual(expect.arrayContaining([expect.stringMatching(/^a\.ts:1$/)]));
  });
});

describe('runApply — bad input', () => {
  it('reports exit code 2 for input that is not a share payload', async () => {
    const { exitCode } = expectFail(runApply('not a payload', { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(2);
  });
});

describe('runApply — payload sources', () => {
  it('accepts a payload embedded in a URL under any query param name', async () => {
    await write('a.ts', `rig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const url = `https://example.com/?tune=${encodeShare(payload)}`;
    const { exitCode } = expectOk(runApply(url, { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
  });

  it('accepts a payload from a file path', async () => {
    await write('a.ts', `rig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const file = await write('payload.txt', encodeShare(payload));
    const { exitCode } = expectOk(runApply(file, { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
  });

  // A relative input path is resolved against cwd, never against --root.
  it('resolves a relative input file against cwd, not --root', async () => {
    await write('src/a.ts', `rig('hero', { duration: 1 });`);
    const cwdDir = await mkdtemp(join(tmpdir(), 'motionrig-cwd-'));
    try {
      const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
      await writeFile(join(cwdDir, 'payload.txt'), encodeShare(payload));
      // root points at `dir` (where the source lives); cwd points elsewhere (where the payload file lives)
      const { exitCode } = expectOk(runApply('payload.txt', { root: dir, cwd: cwdDir, dryRun: false, force: false }));
      expect(exitCode).toBe(0);
      expect(await readFile(join(dir, 'src', 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
    } finally {
      await rm(cwdDir, { recursive: true, force: true });
    }
  });

  it('a relative input file that only exists under --root (not cwd) is bad input', async () => {
    await write('payload.txt', 'irrelevant');
    const cwdDir = await mkdtemp(join(tmpdir(), 'motionrig-cwd-'));
    try {
      // "payload.txt" exists under `dir` (root) but not under cwdDir — must not be found via root.
      const { exitCode } = expectFail(runApply('payload.txt', { root: dir, cwd: cwdDir, dryRun: false, force: false }));
      expect(exitCode).toBe(2);
    } finally {
      await rm(cwdDir, { recursive: true, force: true });
    }
  });
});

describe('runApply — CSS fallback replacement', () => {
  it('replaces a var() fallback, paren-balanced, in a .css file', async () => {
    await write('styles.css', `.x { transition-timing-function: var(--faq-ease, cubic-bezier(1, 0, 0, 1)); }`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--faq-ease': 'cubic-bezier(0.4, 0, 1, 1)' } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(report.css?.applied[0]).toMatchObject({
      name: '--faq-ease',
      oldText: 'cubic-bezier(1, 0, 0, 1)',
      newText: 'cubic-bezier(0.4, 0, 1, 1)',
    });
    const text = await readFile(join(dir, 'styles.css'), 'utf8');
    expect(text).toBe(`.x { transition-timing-function: var(--faq-ease, cubic-bezier(0.4, 0, 1, 1)); }`);
  });

  it('replaces a var() fallback in .sass indented syntax', async () => {
    await write('styles.module.sass', `.x\n  color: var(--faq-ease, cubic-bezier(1, 0, 0, 1))\n`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--faq-ease': '0.7s' } } };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const text = await readFile(join(dir, 'styles.module.sass'), 'utf8');
    expect(text).toBe(`.x\n  color: var(--faq-ease, 0.7s)\n`);
  });

  it('a plain .css file does not treat "//" in a url() as a comment', async () => {
    await write('styles.css', `.a { background: url(http://x.com/a.png); color: var(--faq-ease, red); }`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--faq-ease': 'blue' } } };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const text = await readFile(join(dir, 'styles.css'), 'utf8');
    expect(text).toBe(`.a { background: url(http://x.com/a.png); color: var(--faq-ease, blue); }`);
  });

  it('an unclosed var() is left alone entirely, and other files/vars still get patched', async () => {
    await write('broken.css', `.a { background: var(--bg, url(http://x.com/a.png);\n`);
    await write('ok.css', `.d { transition: var(--d, 1s); }`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { x: { '--bg': 'none', '--d': '2s' } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1); // --bg is legitimately "not found" since its var() never closed
    expect(report.css?.notFound).toContain('--bg');
    expect(await readFile(join(dir, 'broken.css'), 'utf8')).toBe(`.a { background: var(--bg, url(http://x.com/a.png);\n`);
    expect(await readFile(join(dir, 'ok.css'), 'utf8')).toBe(`.d { transition: var(--d, 2s); }`);
  });

  it('reports a hint and exit code 1 when no fallback is found', async () => {
    await write('styles.css', `.x { color: red; }`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--faq-ease': '0.7s' } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    expect(report.css?.notFound).toEqual(['--faq-ease']);
  });

  // Each value would break out of the var() fallback, or reach past what the css scan understands
  // (escapes): skipped with one reason, nothing written, exit code 1.
  it.each([
    ['`;` `{` `}`', '0s}body{display:none'],
    ['unbalanced parens', 'calc(1px + 2px'],
    ['an unbalanced bracket', '[a 1fr'],
    ['a stray closing bracket', 'a]'],
    ['an opened block comment', '1s /*'],
    ['an unterminated quote', "1s '"],
    ['a trailing backslash', '1s\\'],
    ['a backslash escape', '"\\201C"'],
    ['a `//` line comment', '1s // comment'],
    ['an embedded newline', '1s\nmore'],
  ])('rejects a css value with %s: skipped, stylesheet unchanged, exit code 1', async (_, value) => {
    const original = `.x { transition: var(--a, 1s); }`;
    await write('styles.css', original);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--a': value } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    expect(report.css?.skipped).toEqual([{ name: '--a', reason: 'unsafe value (could break out of the declaration)' }]);
    expect(report.css?.applied).toEqual([]);
    expect(await readFile(join(dir, 'styles.css'), 'utf8')).toBe(original);
  });

  // A payload with two var names, only one of which is present, must still apply the
  // one that is, and separately report the other as not found (not lump everything together).
  it('applies the vars that are found and reports the rest as not found, per name', async () => {
    await write('styles.css', `.x { transition: var(--found, 1s); }`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--found': '2s', '--missing': '3s' } } };
    const { exitCode, report } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(1);
    expect(report.css?.applied.map((a) => a.name)).toEqual(['--found']);
    expect(report.css?.notFound).toEqual(['--missing']);
    expect(await readFile(join(dir, 'styles.css'), 'utf8')).toBe(`.x { transition: var(--found, 2s); }`);
  });

  // A nested fallback must still be reachable when the outer var isn't in the payload.
  it('patches a nested fallback var(--b, ...) when the outer var(--a, ...) is not in the payload', async () => {
    await write('styles.css', `.x { transition-duration: var(--a, var(--b, 1s)); }`);
    const payload: SharePayload = { v: 1, o: {}, b: {}, css: { faq: { '--b': '9s' } } };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    expect(await readFile(join(dir, 'styles.css'), 'utf8')).toBe(`.x { transition-duration: var(--a, var(--b, 9s)); }`);
  });
});

describe('runApply — byte-for-byte formatting elsewhere', () => {
  it('touches only the value spans it patches', async () => {
    const original = `// header comment\nrig('hero', {\n  // a\n  a: 1, // trailing\n  duration: 1,\n  b: 2,\n});\n`;
    await write('a.ts', original);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const { exitCode } = expectOk(runApply(encodeShare(payload), { root: dir, dryRun: false, force: false }));
    expect(exitCode).toBe(0);
    const text = await readFile(join(dir, 'a.ts'), 'utf8');
    expect(text).toBe(`// header comment\nrig('hero', {\n  // a\n  a: 1, // trailing\n  duration: 1.2,\n  b: 2,\n});\n`);
  });
});
