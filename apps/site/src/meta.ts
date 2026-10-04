import type { Metadata } from 'next';

/**
 * A page's title, description and canonical path, repeated in its link-preview tags. Next
 * replaces `openGraph` and `twitter` whole instead of merging them, so a page that sets only a
 * title would still preview as the home page. Setting `openGraph` also drops the inherited image:
 * each page's folder re-exports app/opengraph-image.tsx, and `twitter:image` falls back to it.
 */
export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: 'motionrig', url: path, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}
