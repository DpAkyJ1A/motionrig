// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { version } from '../../package.json';
import { encodeShare } from '../core/payload';
import type { SharePayload } from '../core/types';
import { runCli } from './run';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'motionrig-cli-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('runCli — --help / --version', () => {
  it('prints the help for --help or -h, wherever it is, and exits 0', () => {
    for (const argv of [['--help'], ['-h'], ['apply', 'garbage', '--help']]) {
      const r = runCli(argv);
      expect(r.code).toBe(0);
      expect(r.out).toMatch(/^Usage:\n  motionrig apply /);
    }
  });

  it('prints the package version for --version or -v', () => {
    for (const flag of ['--version', '-v']) expect(runCli([flag])).toEqual({ code: 0, out: `motionrig ${version}\n`, err: '' });
  });
});

describe('runCli — bad usage exits 2 and says why', () => {
  it.each([
    ['no command', [], /^Missing command\.\n\nUsage:/],
    ['an unknown command', ['frobnicate'], /^Unknown command: frobnicate\.\n\nUsage:/],
    ['apply without its argument', ['apply'], /^Usage: motionrig apply /],
    ['two arguments', ['apply', 'a', 'b'], /^Usage: motionrig apply /],
    ['an unknown flag', ['apply', 'x', '--nope'], /^Unknown flag: --nope\n$/],
    ['--root at the end', ['apply', 'x', '--root'], /^--root needs a directory\.\n$/],
    ['an empty --root=', ['apply', 'x', '--root='], /^--root needs a directory\.\n$/],
    ['a flag where --root wants its directory', ['apply', 'x', '--root', '--dry-run'], /^--root needs a directory\.\n$/],
  ])('%s', (_, argv, err) => {
    const r = runCli(argv);
    expect(r.code).toBe(2);
    expect(r.out).toBe('');
    expect(r.err).toMatch(err);
  });
});

describe('runCli — apply', () => {
  it('runs apply end to end against a fixture, dry-run', async () => {
    await writeFile(join(dir, 'a.ts'), `rig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const r = runCli(['apply', encodeShare(payload), '--root', dir, '--dry-run']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('hero');
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1 });`);
  });

  it('runs apply for real and writes the file', async () => {
    await writeFile(join(dir, 'a.ts'), `rig('hero', { duration: 1 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: {} };
    const r = runCli(['apply', encodeShare(payload), '--root', dir]);
    expect(r.code).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
  });

  it('passes --force through', async () => {
    await writeFile(join(dir, 'a.ts'), `rig('hero', { duration: 5 });`);
    const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: { hero: { duration: 1 } } };
    const withoutForce = runCli(['apply', encodeShare(payload), '--root', dir]);
    expect(withoutForce.code).toBe(1);
    const withForce = runCli(['apply', encodeShare(payload), '--root', dir, '--force']);
    expect(withForce.code).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
  });

  it('exits 2 with a message when --root is missing or not a directory', async () => {
    await writeFile(join(dir, 'a.ts'), `rig('hero', { duration: 1 });`);
    const link = encodeShare({ v: 1, o: { hero: { duration: 1.2 } }, b: {} });
    for (const root of [join(dir, 'nope'), join(dir, 'a.ts')]) {
      const r = runCli(['apply', link, '--root', root]);
      expect(r.code).toBe(2);
      expect(r.out).toBe('');
      expect(r.err).toBe(`Not a directory: ${root} (--root).\n`);
    }
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1 });`);
  });

  it('exits 2 with a message for bad input', () => {
    expect(runCli(['apply', 'not a payload', '--root', dir])).toEqual({
      code: 2,
      out: '',
      err: 'Not a motionrig share link, payload or file.\n',
    });
  });

  it('takes --root=<dir> as well as --root <dir>', async () => {
    await writeFile(join(dir, 'a.ts'), `rig('hero', { duration: 1 });`);
    const link = encodeShare({ v: 1, o: { hero: { duration: 1.2 } }, b: {} });
    expect(runCli(['apply', link, `--root=${dir}`]).code).toBe(0);
    expect(await readFile(join(dir, 'a.ts'), 'utf8')).toBe(`rig('hero', { duration: 1.2 });`);
  });
});

describe('runCli — colour', () => {
  it('colours the report on a TTY, never with NO_COLOR set', async () => {
    await writeFile(join(dir, 'a.ts'), `rig('hero', { duration: 1 });`);
    const link = encodeShare({ v: 1, o: { hero: { duration: 1.2 } }, b: {} });
    const args = ['apply', link, '--root', dir, '--dry-run'];
    expect(runCli(args, { env: {}, isTTY: true }).out).toMatch(/\x1b\[/);
    expect(runCli(args, { env: { NO_COLOR: '1' }, isTTY: true }).out).not.toMatch(/\x1b\[/);
  });
});
