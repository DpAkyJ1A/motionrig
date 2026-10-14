import { page, pages, SITE } from '@/docs/content';
import { pageMarkdown } from '@/docs/markdown';

/**
 * /docs/<slug>.md and /docs.md, rewritten here by next.config.ts: each docs page as
 * Markdown, built ahead like the pages. The canonical link points search engines at the page.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return pages().map((p) => ({ slug: p.slug }));
}

export async function GET(_: Request, { params }: RouteContext<'/md/[slug]'>) {
  const doc = page((await params).slug)!;
  return new Response(pageMarkdown(doc), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      link: `<${SITE}${doc.href}>; rel="canonical"`,
    },
  });
}
