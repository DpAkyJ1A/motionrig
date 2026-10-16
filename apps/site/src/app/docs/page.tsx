import type { Metadata } from 'next';
import { DocPage } from '@/components/Docs/DocPage';
import { LegacyHash } from '@/components/Docs/LegacyHash';
import { page } from '@/docs/content';
import { pageMeta } from '@/meta';

const intro = () => page('introduction')!;

export function generateMetadata(): Metadata {
  const doc = intro();
  return {
    ...pageMeta('/docs', 'Docs — motionrig, a live tuning panel for web animations', doc.description),
    alternates: { canonical: '/docs', types: { 'text/markdown': doc.mdHref } },
  };
}

export default function DocsPage() {
  return (
    <>
      <DocPage page={intro()} />
      <LegacyHash />
    </>
  );
}
