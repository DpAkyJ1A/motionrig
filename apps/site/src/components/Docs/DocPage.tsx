import Link from 'next/link';
import { Footer } from '@/components/Footer/Footer';
import { Nav } from '@/components/Nav/Nav';
import p from '@/components/Page/Page.module.css';
import { Ring } from '@/components/Ring/Ring';
import sec from '@/components/Section/Section.module.css';
import { type DocPage as Page, GROUPS, neighbours, pages, SITE } from '@/docs/content';
import { pageMarkdown } from '@/docs/markdown';
import { docNodes, JsonLd } from '@/jsonld';
import { REPO, NEW_TAB } from '@/repo';
import { CopyPage } from './CopyPage';
import d from './Docs.module.css';
import { DocsNav, type NavGroup } from './DocsNav';
import { Markdown, outline } from './Markdown';

/** Where a page's Markdown lives in the repo, for "Edit this page". */
const source = (slug: string) => `${REPO}/blob/main/apps/site/content/docs/${slug}.md`;

/** One docs page: the menu, the title row with Copy page, the body, and the way on. */
export function DocPage({ page }: { page: Page }) {
  const all = pages();
  const groups: NavGroup[] = GROUPS.map((g) => ({
    title: g.title,
    pages: all.filter((x) => x.group === g.title).map(({ slug, title, href }) => ({ slug, title, href })),
  }));
  const { prev, next } = neighbours(page.slug);

  return (
    <>
      <JsonLd nodes={docNodes(page)} />
      <Nav page="docs" />
      <main id="main">
        <div className={`${p.layout} ${d.layout}`}>
          <DocsNav key={page.slug} groups={groups} current={page.slug} outline={outline(page.body)} />
          <article className={`${p.content} ${d.doc}`}>
            <header className={d.head}>
              <p className={p.kicker}>
                <Ring size={16} strokeWidth={2.4} /> Docs · {page.group}
              </p>
              <div className={d.titleRow}>
                <h1 className={`${sec.title} ${d.h1}`} data-rig="type">
                  {page.title}
                </h1>
                <CopyPage key={page.slug} markdown={pageMarkdown(page)} mdHref={page.mdHref} mdUrl={SITE + page.mdHref} />
              </div>
              <p className={d.lead}>{page.description}</p>
            </header>
            <div className={d.body}>
              <Markdown source={page.body} />
            </div>
            <footer className={d.foot}>
              <nav className={d.pager} aria-label="Docs pages">
                {prev && (
                  <Link href={prev.href} className={d.prev}>
                    <small>← Previous</small>
                    {prev.title}
                  </Link>
                )}
                {next && (
                  <Link href={next.href} className={d.next}>
                    <small>Next →</small>
                    {next.title}
                  </Link>
                )}
              </nav>
              <p className={d.edit}>
                <a href={source(page.slug)} {...NEW_TAB}>
                  Edit this page on GitHub
                </a>
                <span aria-hidden="true">·</span>
                <a href={`${REPO}/issues`} {...NEW_TAB}>
                  Ask a question or report a problem
                </a>
              </p>
            </footer>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
