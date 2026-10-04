// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { encodeShare } from '../core/payload';
import type { SharePayload } from '../core/types';
import { resolveInput } from './input';

const payload: SharePayload = { v: 1, o: { hero: { duration: 1.2 } }, b: { hero: { duration: 1 } } };
const encoded = encodeShare(payload);

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'motionrig-input-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

// What the text may hold is findShare's (core/find.test.ts); here: argument or file.
describe('resolveInput', () => {
  it('takes the argument itself as the link or payload', () => {
    expect(resolveInput(`https://example.com/?rig=${encoded}`, dir)).toEqual(payload);
    expect(resolveInput(encoded, dir)).toEqual(payload);
  });

  it.each([
    ['the raw payload', encoded],
    ['a share link', `https://example.com/page?rig=${encoded}\n`],
    ['the payload as JSON', JSON.stringify(payload, null, 2)],
  ])('reads a file holding %s', async (_, text) => {
    const file = join(dir, 'input.txt');
    await writeFile(file, text);
    expect(resolveInput(file, dir)).toEqual(payload);
  });

  it('resolves a relative file path against the given cwd', async () => {
    await writeFile(join(dir, 'rel.txt'), encoded);
    expect(resolveInput('rel.txt', dir)).toEqual(payload);
  });

  it('is undefined for garbage, an empty argument, or a file holding neither', async () => {
    await writeFile(join(dir, 'notes.txt'), 'hello');
    expect(resolveInput('not a payload at all', dir)).toBeUndefined();
    expect(resolveInput('', dir)).toBeUndefined();
    expect(resolveInput('notes.txt', dir)).toBeUndefined();
  });
});
