'use client';

import { useEffect, useRef, useState } from 'react';
import { Fire } from '@/components/Fire/Fire';
import s from './SideNav.module.css';

export type NavItem = { id: string; label: string; meta?: string; hot?: boolean; children?: NavItem[] };

const flat = (items: NavItem[]): NavItem[] => items.flatMap((i) => [i, ...flat(i.children ?? [])]);

/** The id of the last section whose top has passed ~a third of the viewport (or the last one at the very bottom). */
function useActive(ids: string[]): string | undefined {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    let raf = 0;
    // Reads only, once per frame at most: no layout writes, so nothing thrashes.
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(bottom ? els[els.length - 1]?.id : current);
    };
    const onScroll = () => {
      raf ||= requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);
  return active;
}

function List({ items, active, onPick, depth = 0 }: { items: NavItem[]; active?: string; onPick?: () => void; depth?: number }) {
  return (
    <ol className={depth ? s.sub : s.list}>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`} aria-current={item.id === active ? 'location' : undefined} onClick={onPick}>
            {item.meta && <span className={s.meta}>{item.meta}</span>}
            {item.label}
            {item.hot && <Fire size={12} className={s.hot} />}
          </a>
          {item.children && <List items={item.children} active={active} onPick={onPick} depth={depth + 1} />}
        </li>
      ))}
    </ol>
  );
}

/**
 * The in-page menu: a sticky list beside the content on desktop, with the current
 * section highlighted on scroll. On phones it becomes a sticky chip bar (`chips`)
 * or an "On this page" disclosure (`disclosure`).
 */
export function SideNav({ items, title, mobile }: { items: NavItem[]; title: string; mobile: 'chips' | 'disclosure' }) {
  const all = flat(items);
  const [ids] = useState(() => all.map((i) => i.id));
  const active = useActive(ids);
  const details = useRef<HTMLDetailsElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const current = all.find((i) => i.id === active);

  // Keep the active chip in view inside its own scroller; the page itself never scrolls sideways.
  useEffect(() => {
    const bar = chips.current;
    const chip = bar?.querySelector<HTMLElement>('[aria-current]');
    if (!bar || !chip || bar.scrollWidth <= bar.clientWidth) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: still ? 'instant' : 'smooth' });
  }, [active]);

  return (
    <aside className={s.aside} data-mobile={mobile}>
      <nav className={s.desktop} aria-label={title}>
        <p className={s.title}>{title}</p>
        <List items={items} active={active} />
      </nav>

      {mobile === 'chips' ? (
        <nav className={s.chips} aria-label={title} ref={chips}>
          {all.map((item) => (
            <a key={item.id} href={`#${item.id}`} aria-current={item.id === active ? 'location' : undefined}>
              {item.meta && <span className={s.meta}>{item.meta}</span>}
              {item.label}
              {item.hot && <Fire size={12} className={s.hot} />}
            </a>
          ))}
        </nav>
      ) : (
        <details className={s.disclosure} ref={details}>
          <summary>
            <span className={s.summaryTitle}>{title}</span>
            <span className={s.summaryCurrent}>{current?.label}</span>
          </summary>
          <nav aria-label={title}>
            <List
              items={items}
              active={active}
              onPick={() => {
                if (details.current) details.current.open = false;
              }}
            />
          </nav>
        </details>
      )}
    </aside>
  );
}
