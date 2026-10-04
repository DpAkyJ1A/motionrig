// Its own module so FileIcon, which ships to the browser, doesn't bring the highlighter along.
export type Lang = 'ts' | 'tsx' | 'js' | 'css' | 'sh' | 'json' | 'html';

/** The language a file name implies, if it says. */
export function langOf(name?: string): Lang | undefined {
  const ext = name?.match(/\.([a-z]+)$/i)?.[1]?.toLowerCase();
  if (!ext) return undefined;
  if (ext === 'mts' || ext === 'cts') return 'ts';
  if (ext === 'jsx') return 'tsx';
  if (ext === 'mjs' || ext === 'cjs') return 'js';
  if (ext === 'scss') return 'css';
  if (ext === 'htm') return 'html';
  return (['ts', 'tsx', 'js', 'css', 'json', 'html', 'sh'] as const).find((l) => l === ext);
}
