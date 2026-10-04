import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { findShare } from '../core/find';
import type { SharePayload } from '../core/types';

/** Resolves the `apply` argument: a share link, a raw payload, or a path to a file holding either (or the payload as JSON). */
export function resolveInput(arg: string, cwd: string): SharePayload | undefined {
  const path = isAbsolute(arg) ? arg : join(cwd, arg);
  try {
    if (existsSync(path) && statSync(path).isFile()) return findShare(readFileSync(path, 'utf8'));
  } catch {
    // Unreadable: `arg` is taken as the payload text itself.
  }
  return findShare(arg);
}
