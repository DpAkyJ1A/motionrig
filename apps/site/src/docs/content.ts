import fs from 'node:fs';
import path from 'node:path';
import type { MessageKey } from 'motionrig';
import PKG from 'motionrig/package.json';
import { sizeOf } from '@/sizes';

/**
 * The docs live in content/docs/*.md: one file per page, frontmatter on top. The same text
 * renders the HTML page and is served as Markdown (/docs/<slug>.md, /llms-full.txt), so
 * the copy an AI assistant gets is the page itself. The order and grouping live here.
 */
export const GROUPS = [
  { title: 'Getting started', slugs: ['introduction', 'installation'] },
  { title: 'Guides', slugs: ['live-updates', 'controls', 'eases', 'css-variables', 'panel', 'handoff'] },
  { title: 'API reference', slugs: ['rig', 'configure', 'react', 'runtime', 'cli'] },
  { title: 'Help', slugs: ['troubleshooting'] },
] as const;

export type Slug = (typeof GROUPS)[number]['slugs'][number];

export type DocPage = {
  slug: Slug;
  title: string;
  description: string;
  group: string;
  /** The HTML page and its Markdown twin, both site-relative. */
  href: string;
  mdHref: string;
  /** The body, placeholders filled in, without frontmatter. */
  body: string;
};

/** The canonical site: the package's own homepage, so npm, the README and the docs agree. */
export const SITE = PKG.homepage.replace(/\/$/, '');

const DIR = path.join(process.cwd(), 'content/docs');

const floor = (range: string) => range.replace('>=', '≥ ');

// Every key of the panel's messages. Checked against the package's MessageKey type, so a
// key the panel adds or drops fails the build instead of going stale in the docs.
const MESSAGE_KEYS = Object.keys({
  open: 0, panel: 0, search: 0, share: 0, collapse: 0, tabs: 0, new: 0, changed: 0, noMatch: 0, empty: 0,
  emptyHint: 0, live: 0, replay: 0, reload: 0, replayBtn: 0, reloadBtn: 0, locate: 0, locateNone: 0, more: 0,
  less: 0, reset: 0, value: 0, pick: 0, custom: 0, palette: 0, builtins: 0, curves: 0, handle: 0, preview: 0,
  params: 0, copyCurve: 0, curveCopied: 0, copyCode: 0, resetTab: 0, resetAll: 0, confirm: 0, codeCopied: 0,
  linkCopied: 0, payloadCopied: 0, imported: 0, tweaks: 0, rigs: 0, moreTabs: 0, seenAll: 0, seenAllName: 0,
  nothingChanged: 0, tabReset: 0, allReset: 0, manual: 0, close: 0,
} satisfies Record<MessageKey, 0>);

/** `{{name}}` in a page: facts read from the package, so the docs never quote a stale number. */
const VARS: Record<string, string> = {
  'size.core': sizeOf('core — rig'),
  'size.all': sizeOf('core — every'),
  'size.react': sizeOf('react'),
  'size.panel': sizeOf('panel'),
  react: floor(PKG.peerDependencies.react),
  node: floor(PKG.engines.node),
  version: PKG.version,
  messageKeys: MESSAGE_KEYS.map((k) => `\`${k}\``).join(', '),
};

function fill(text: string, file: string): string {
  return text.replace(/\{\{([\w.]+)\}\}/g, (_, name: string) => {
    const value = VARS[name];
    if (value === undefined) throw new Error(`${file}: unknown placeholder {{${name}}}`);
    return value;
  });
}

/** `key: value` lines between `---` fences; a value may be double-quoted. */
function frontmatter(src: string, file: string): { data: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const data: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const raw = kv[2]!.trim();
    data[kv[1]!] = raw.startsWith('"') ? JSON.parse(raw) : raw;
  }
  return { data, body: src.slice(m[0].length).trim() };
}

const hrefOf = (slug: Slug) => (slug === 'introduction' ? '/docs' : `/docs/${slug}`);

function load(slug: Slug, group: string): DocPage {
  const file = `${slug}.md`;
  const { data, body } = frontmatter(fs.readFileSync(path.join(DIR, file), 'utf8'), file);
  if (!data.title || !data.description) throw new Error(`${file}: title and description are required`);
  const href = hrefOf(slug);
  return { slug, title: data.title, description: data.description, group, href, mdHref: `${href}.md`, body: fill(body, file) };
}

let cache: DocPage[] | undefined;

/** Every page, in reading order. Read once per build; in dev, on every request, so edits show on reload. */
export function pages(): DocPage[] {
  if (cache) return cache;
  const all = GROUPS.flatMap((g) => g.slugs.map((slug) => load(slug, g.title)));
  if (process.env.NODE_ENV === 'production') cache = all;
  return all;
}

export function page(slug: string): DocPage | undefined {
  return pages().find((p) => p.slug === slug);
}

/** The pages before and after, for the links at the foot of a page. */
export function neighbours(slug: Slug): { prev?: DocPage; next?: DocPage } {
  const all = pages();
  const i = all.findIndex((p) => p.slug === slug);
  return { prev: all[i - 1], next: all[i + 1] };
}
