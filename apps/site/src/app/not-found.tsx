import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer/Footer';
import { Nav } from '@/components/Nav/Nav';
import p from '@/components/Page/Page.module.css';
import { Ring } from '@/components/Ring/Ring';
import sec from '@/components/Section/Section.module.css';

// Any URL the site doesn't have. Next answers it with a 404 and marks it noindex.
export const metadata: Metadata = { title: 'Not found — motionrig' };

export default function NotFound() {
  return (
    <>
      <Nav page="other" />
      <main id="main">
        <header className={p.intro}>
          <p className={p.kicker}>
            <Ring size={16} strokeWidth={2.4} /> 404
          </p>
          <h1 className={`${sec.title} ${sec.widest} ${p.introTitle}`}>Nothing is rigged here</h1>
          <p className={sec.lead}>
            This page doesn’t exist. Try the <Link href="/">landing page</Link>, the <Link href="/docs">docs</Link>{' '}
            or the <Link href="/examples">examples</Link>.
          </p>
        </header>
      </main>
      <Footer />
    </>
  );
}
