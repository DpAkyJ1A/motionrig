import PKG from 'motionrig/package.json';
import { type DocPage, SITE } from '@/docs/content';
import { NPM, REPO } from '@/repo';

/**
 * Structured data (schema.org JSON-LD) for search engines and AI assistants. Every page carries
 * the same three nodes, the library, the site and its author, so it reads on its own; a page adds
 * its own nodes on top, and the `@id`s tie them into one graph.
 */

const ID = { site: `${SITE}/#website`, library: `${SITE}/#library`, author: `${SITE}/#author` };

// The package's author in npm's `name (url)` form.
const [, authorName, authorUrl] = /^(.*?)\s*\((.*)\)$/.exec(PKG.author)!;

const SHARED = [
  { '@type': 'WebSite', '@id': ID.site, url: SITE, name: 'motionrig', inLanguage: 'en', publisher: { '@id': ID.author } },
  {
    '@type': 'SoftwareSourceCode',
    '@id': ID.library,
    name: 'motionrig',
    description: PKG.description,
    url: SITE,
    codeRepository: REPO,
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'Web browser',
    version: PKG.version,
    license: `https://spdx.org/licenses/${PKG.license}.html`,
    keywords: PKG.keywords.join(', '),
    author: { '@id': ID.author },
    sameAs: [REPO, NPM],
  },
  { '@type': 'Person', '@id': ID.author, name: authorName, url: authorUrl },
];

/** Site-relative paths, outermost first: the trail a search result shows above the title. */
export function breadcrumbs(...trail: [name: string, path: string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })),
  };
}

/** A docs page: the article and its trail. */
export function docNodes(page: DocPage) {
  const url = SITE + page.href;
  const trail: [string, string][] = [['motionrig', '/'], ['Docs', '/docs']];
  if (page.href !== '/docs') trail.push([page.title, page.href]);
  return [
    {
      '@type': 'TechArticle',
      '@id': `${url}#article`,
      headline: page.title,
      description: page.description,
      url,
      image: `${url}/opengraph-image`,
      inLanguage: 'en',
      isPartOf: { '@id': ID.site },
      about: { '@id': ID.library },
      author: { '@id': ID.author },
    },
    breadcrumbs(...trail),
  ];
}

export function JsonLd({ nodes = [] }: { nodes?: object[] }) {
  const data = { '@context': 'https://schema.org', '@graph': [...nodes, ...SHARED] };
  // `<` escaped, so no string in the data can close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
