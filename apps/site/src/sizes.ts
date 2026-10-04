import SIZES from './sizes.json';

/**
 * Gzipped sizes, written by scripts/sizes.mjs from the package's own size-limit config on
 * every site build. Formatted the way size-limit prints them, so the page reads exactly
 * like `pnpm --filter motionrig size`.
 */
export const formatBytes = (bytes: number) =>
  bytes < 1000 ? `${bytes} B` : `${Number.parseFloat((bytes / 1000).toFixed(2))} kB`;

export const sizes = SIZES.map((m) => ({ ...m, label: formatBytes(m.bytes) }));

/** One entry by the start of its size-limit name; a renamed entry fails the build, not the page. */
export function sizeOf(prefix: string) {
  const entry = sizes.find((m) => m.name.startsWith(prefix));
  if (!entry) throw new Error(`No size-limit entry starts with "${prefix}"`);
  return entry.label;
}
