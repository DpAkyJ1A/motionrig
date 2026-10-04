// Measures the package with its own size-limit config and writes the numbers the Features section shows.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = fileURLToPath(new URL('../../../packages/motionrig/', import.meta.url));
const out = fileURLToPath(new URL('../src/sizes.json', import.meta.url));

let raw;
try {
  raw = execFileSync('pnpm', ['exec', 'size-limit', '--json'], { cwd: pkg, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
} catch (err) {
  // size-limit exits 1 when a limit is exceeded, but the measurements are still on stdout.
  raw = err.stdout;
  if (!raw) throw err;
}

const sizes = JSON.parse(raw).map(({ name, size }) => ({ name, bytes: size }));
writeFileSync(out, `${JSON.stringify(sizes, null, 2)}\n`);
