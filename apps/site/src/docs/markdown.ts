import PKG from 'motionrig/package.json';
import { type DocPage, GROUPS, pages, SITE } from './content';

/**
 * The Markdown side of the docs: one page for "Copy page" and /docs/<slug>.md, and the
 * llms.txt pair. Same text as the HTML page, minus what only a browser can use.
 */

/** A heading's text and anchor: `## Title {#id}` sets the id, otherwise it is the slugged text. */
export function heading(raw: string): { text: string; id: string } {
  const m = /^(.*?)\s*\{#([\w-]+)\}$/.exec(raw);
  const text = (m ? m[1]! : raw).trim();
  const id =
    m?.[2] ??
    text
      .toLowerCase()
      .replace(/[`'’"()?.,:!]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return { text, id };
}

const absolute = (href: string) => (href.startsWith('/') ? SITE + href : href);

/** The page body as plain Markdown: absolute links, file names as `filename="…"`, no site-only markers. */
function body(md: string): string {
  const out: string[] = [];
  let fence = false;
  for (const line of md.split('\n')) {
    const open = /^```(\w+)(?:\s+(\S+))?\s*$/.exec(line);
    if (line.startsWith('```')) {
      if (!fence && open) {
        const [, lang, label] = open;
        out.push(label && label !== 'install' ? `\`\`\`${lang} filename="${label}"` : `\`\`\`${lang}`);
      } else out.push(line);
      fence = !fence;
      continue;
    }
    if (fence) {
      out.push(line);
      continue;
    }
    // Tabs and live demos are for the browser; the headings inside the tabs carry over.
    if (/^<!--.*-->$/.test(line.trim())) continue;
    out.push(
      line
        .replace(/^(#{2,6} .*?)\s*\{#[\w-]+\}$/, '$1')
        .replace(/\]\((\/[^)\s]*)\)/g, (_, href: string) => `](${absolute(href)})`),
    );
  }
  // Removed markers leave runs of blank lines behind.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** One page, as "Copy page" copies it and /docs/<slug>.md serves it. */
export function pageMarkdown(page: DocPage): string {
  return [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    `url: ${SITE}${page.href}`,
    `package: motionrig@${PKG.version}`,
    '---',
    '',
    `# ${page.title}`,
    '',
    `> ${page.description}`,
    '',
    body(page.body),
    '',
    '---',
    '',
    `All docs pages: ${SITE}/llms.txt`,
    '',
  ].join('\n');
}

const SUMMARY =
  'motionrig is a tuning panel for the animation constants of a live site. Wrap an object of durations, eases and distances in rig(), open the site with ?rig, tune the values while the animation plays, then send them back to code: Copy code, a share link, or `npx motionrig apply`.';

/** The index for AI assistants, in the llms.txt format (llmstxt.org). */
export function llmsTxt(): string {
  const all = pages();
  const sections = GROUPS.map((g) =>
    [
      `## ${g.title}`,
      '',
      ...all.filter((p) => p.group === g.title).map((p) => `- [${p.title}](${SITE}${p.mdHref}): ${p.description}`),
    ].join('\n'),
  );
  return [
    '# motionrig',
    '',
    `> ${SUMMARY}`,
    '',
    `Package: \`motionrig\` v${PKG.version} on npm. Entry points: \`motionrig\` (rig, configure, mountPanel, openPanel and the store functions), \`motionrig/react\` (useRig, RigPanel), and the \`motionrig\` CLI. Every page below is Markdown; ${SITE}/llms-full.txt is all of them in one file.`,
    '',
    ...sections.flatMap((s) => [s, '']),
    '## Optional',
    '',
    `- [Examples](${SITE}/examples): a live recipe per engine (CSS, GSAP, Motion, WAAPI, canvas, React state), with the code`,
    `- [Source code](${PKG.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')})`,
    '',
  ].join('\n');
}

/** Every page in one file, in reading order. */
export function llmsFull(): string {
  const parts = pages().map((p) =>
    [`# ${p.title}`, '', `Source: ${SITE}${p.href}`, '', `> ${p.description}`, '', body(p.body)].join('\n'),
  );
  return [`# motionrig documentation`, '', `> ${SUMMARY}`, '', ...parts.flatMap((p) => ['---', '', p, ''])].join('\n');
}
