'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useActive } from '@/components/SideNav/SideNav';
import s from '@/components/SideNav/SideNav.module.css';
import n from './DocsNav.module.css';

export type NavGroup = { title: string; pages: { slug: string; title: string; href: string }[] };
export type Outline = { id: string; label: string }[];

/**
 * The docs menu: every page by group, and under the open one its sections, lit as you
 * scroll. A sticky column on desktop; on phones a "Docs" disclosure under the header.
 */
export function DocsNav({ groups, current, outline }: { groups: NavGroup[]; current: string; outline: Outline }) {
  // Mounted once per page (keyed by the slug), so the ids never change under it.
  const [ids] = useState(() => outline.map((o) => o.id));
  const active = useActive(ids);
  const details = useRef<HTMLDetailsElement>(null);
  const page = groups.flatMap((g) => g.pages).find((p) => p.slug === current);
  const section = outline.find((o) => o.id === active);
  const close = () => {
    if (details.current) details.current.open = false;
  };

  const list = (onPick?: () => void) =>
    groups.map((g) => (
      <div key={g.title} className={n.group}>
        <p className={s.title}>{g.title}</p>
        <ol className={s.list}>
          {g.pages.map((p) => (
            <li key={p.slug}>
              <Link href={p.href} aria-current={p.slug === current ? 'page' : undefined} onClick={onPick}>
                {p.title}
              </Link>
              {p.slug === current && outline.length > 0 && (
                <ol className={s.sub}>
                  {outline.map((o) => (
                    <li key={o.id}>
                      <a href={`#${o.id}`} aria-current={o.id === active ? 'location' : undefined} onClick={onPick}>
                        {o.label}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </div>
    ));

  return (
    <aside className={s.aside} data-mobile="disclosure">
      <nav className={`${s.desktop} ${n.desktop}`} aria-label="Docs">
        {list()}
      </nav>
      <details className={s.disclosure} ref={details}>
        <summary>
          <span className={s.summaryTitle}>Docs</span>
          <span className={s.summaryCurrent}>
            {page?.title}
            {section && <span className={n.section}> · {section.label}</span>}
          </span>
        </summary>
        <nav aria-label="Docs" className={n.mobile}>
          {list(close)}
        </nav>
      </details>
    </aside>
  );
}
