import Link from 'next/link';
import { PanelButton } from '@/components/PanelButton/PanelButton';
import { Ring } from '@/components/Ring/Ring';
import { GitHubMark, NEW_TAB, REPO } from '@/repo';
import s from './Nav.module.css';
import { NavMenu } from './NavMenu';

/** `other` is a page outside the menu (the 404): every link leads away, none is current. */
export type Page = 'home' | 'docs' | 'examples' | 'other';

const SECTIONS = [
  { hash: '#how', label: 'How it works' },
  { hash: '#demos', label: 'Demos' },
  { hash: '#features', label: 'Features' },
  { hash: '#quickstart', label: 'Quickstart' },
];

const PAGES = [
  { href: '/docs', label: 'Docs', page: 'docs' },
  { href: '/examples', label: 'Examples', page: 'examples' },
] as const;

export function Nav({ page }: { page: Page }) {
  const home = page === 'home';
  // On the landing the sections are in-page anchors; elsewhere they lead back to it.
  const sections = SECTIONS.map((l) => ({ href: home ? l.hash : `/${l.hash}`, label: l.label }));
  // Phones get the full list: the landing runs past 15,000 px there.
  const menu = [...sections.slice(0, 3), { href: home ? '#engines' : '/#engines', label: 'Engines' }, ...sections.slice(3)];
  const brand = (
    <>
      <Ring size={22} className={s.logo} />
      <span>motionrig</span>
    </>
  );

  return (
    <header className={s.bar}>
      <div className={s.inner}>
        {home ? (
          <a className={s.brand} href="#top" aria-label="motionrig, back to top">
            {brand}
          </a>
        ) : (
          <Link className={s.brand} href="/" aria-label="motionrig home">
            {brand}
          </Link>
        )}
        <nav className={s.links} aria-label="Site">
          <span className={s.sections}>
            {sections.map((l) =>
              home ? (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ),
            )}
          </span>
          <span className={s.pages}>
            {PAGES.map((l) => (
              <Link key={l.href} href={l.href} aria-current={l.page === page ? 'page' : undefined}>
                {l.label}
              </Link>
            ))}
          </span>
        </nav>
        <span className={s.pill}>v0.1 · npm soon</span>
        <a className={s.gh} href={REPO} aria-label="motionrig on GitHub" title="GitHub" {...NEW_TAB}>
          <GitHubMark size={18} />
        </a>
        <PanelButton className={s.open}>
          <Ring size={16} strokeWidth={2.4} />
          <span>
            Open<span className={s.long}> the panel</span>
          </span>
        </PanelButton>
        <NavMenu
          sections={menu}
          pages={[
            ...PAGES.map((l) => ({ href: l.href, label: l.label, current: l.page === page })),
            { href: REPO, label: 'GitHub', ...NEW_TAB },
          ]}
        />
      </div>
    </header>
  );
}
