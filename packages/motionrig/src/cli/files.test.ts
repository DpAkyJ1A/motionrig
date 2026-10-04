// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CSS_EXTENSIONS, JS_EXTENSIONS, walk } from './files';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'motionrig-files-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('walk', () => {
  it('finds source files by extension, recursively', async () => {
    await mkdir(join(dir, 'sub'), { recursive: true });
    await writeFile(join(dir, 'a.ts'), '');
    await writeFile(join(dir, 'sub', 'b.tsx'), '');
    await writeFile(join(dir, 'ignore.txt'), '');
    const files = walk(dir, JS_EXTENSIONS);
    expect(files.map((f) => f.replace(dir, ''))).toEqual(
      expect.arrayContaining([expect.stringContaining('a.ts'), expect.stringContaining('b.tsx')]),
    );
    expect(files.some((f) => f.endsWith('ignore.txt'))).toBe(false);
  });

  it('skips ignored directories', async () => {
    await mkdir(join(dir, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(dir, 'node_modules', 'pkg', 'x.ts'), '');
    await mkdir(join(dir, 'dist'), { recursive: true });
    await writeFile(join(dir, 'dist', 'y.js'), '');
    await writeFile(join(dir, 'keep.ts'), '');
    const files = walk(dir, JS_EXTENSIONS);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('keep.ts');
  });

  it('finds css-like files with the css extension set', async () => {
    await writeFile(join(dir, 'a.scss'), '');
    await writeFile(join(dir, 'a.sass'), '');
    await writeFile(join(dir, 'a.less'), '');
    await writeFile(join(dir, 'a.css'), '');
    await writeFile(join(dir, 'a.ts'), '');
    const files = walk(dir, CSS_EXTENSIONS);
    expect(files).toHaveLength(4);
  });

  it('tolerates a missing root directory', () => {
    expect(walk(join(dir, 'nope'), JS_EXTENSIONS)).toEqual([]);
  });
});
