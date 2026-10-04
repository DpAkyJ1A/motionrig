// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { runCli } from './run';

vi.mock('./run', () => ({ runCli: vi.fn(() => ({ code: 1, out: 'report\n', err: 'warning\n' })) }));

const exitCode = process.exitCode;
afterEach(() => {
  process.exitCode = exitCode;
});

// Under vitest `process.argv[1]` is vitest itself, just as it is a symlink under a real install:
// an entry that checked it before running would do nothing here.
it('runs the CLI as soon as it loads and hands its outcome to the process', async () => {
  const out = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const err = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  await import('./index');
  expect(runCli).toHaveBeenCalledWith(process.argv.slice(2));
  expect(out).toHaveBeenCalledWith('report\n');
  expect(err).toHaveBeenCalledWith('warning\n');
  expect(process.exitCode).toBe(1);
});
