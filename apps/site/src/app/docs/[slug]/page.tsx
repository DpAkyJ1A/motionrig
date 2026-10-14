import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocPage } from '@/components/Docs/DocPage';
import { page, pages } from '@/docs/content';
import { pageMeta } from '@/meta';

// Every page is built ahead; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return pages()
    .filter((p) => p.slug !== 'introduction')
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/docs/[slug]'>): Promise<Metadata> {
  const doc = page((await params).slug);
  if (!doc) return {};
  const meta = pageMeta(doc.href, `${doc.title} — motionrig docs`, doc.description);
  // The Markdown twin, advertised the way agents look for it.
  return { ...meta, alternates: { ...meta.alternates, types: { 'text/markdown': doc.mdHref } } };
}

export default async function Page({ params }: PageProps<'/docs/[slug]'>) {
  const doc = page((await params).slug);
  if (!doc || doc.slug === 'introduction') notFound();
  return <DocPage page={doc} />;
}
