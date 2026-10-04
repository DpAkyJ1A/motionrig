'use client';

import Link from 'next/link';
import { type CSSProperties, type KeyboardEvent, useRef } from 'react';
import s from './Nav.module.css';

type Item = { href: string; label: string; current?: boolean; target?: string; rel?: string };

/**
 * The site map for narrow screens: a native popover, so Escape and outside clicks close it
 * for free. While it is open, Tab cycles between the Menu button and the links.
 */
export function NavMenu({ sections, pages }: { sections: Item[]; pages: Item[] }) {
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const close = () => sheet.current?.hidePopover();

  const trap = (e: KeyboardEvent) => {
    const el = sheet.current;
    if (e.key !== 'Tab' || !el?.matches(':popover-open')) return;
    const links = el.querySelectorAll('a');
    const first = button.current;
    const last = links[links.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    }
  };

  const item = (l: Item, i: number) => {
    const props = { onClick: close, style: { '--i': i } as CSSProperties };
    return l.href.startsWith('#') || l.href.startsWith('http') ? (
      <a key={l.href} href={l.href} target={l.target} rel={l.rel} {...props}>
        {l.label}
      </a>
    ) : (
      <Link key={l.href} href={l.href} aria-current={l.current ? 'page' : undefined} {...props}>
        {l.label}
      </Link>
    );
  };

  return (
    <span className={s.menuWrap} onKeyDown={trap}>
      <button ref={button} type="button" className={s.menu} popoverTarget="nav-sheet">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className={s.menuLabel}>Menu</span>
      </button>
      <div id="nav-sheet" ref={sheet} popover="auto" className={s.sheet}>
        <nav aria-label="Site">
          {sections.map(item)}
          <span className={s.sheetPages}>{pages.map((l, i) => item(l, sections.length + i))}</span>
        </nav>
      </div>
    </span>
  );
}
