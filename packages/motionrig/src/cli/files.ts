import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

export const JS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
export const CSS_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.git', '.turbo', '.vercel']);

/** Every file under `root` whose extension is in `extensions`, skipping the usual build/vendor directories. */
export function walk(root: string, extensions: Set<string>): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (ent.isDirectory()) {
        if (!IGNORE_DIRS.has(ent.name)) stack.push(join(dir, ent.name));
        continue;
      }
      if (ent.isFile() && extensions.has(extname(ent.name))) out.push(join(dir, ent.name));
    }
  }
  return out.sort();
}
