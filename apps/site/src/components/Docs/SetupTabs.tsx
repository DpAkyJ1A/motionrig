'use client';

import { type KeyboardEvent, type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import d from './Docs.module.css';

export type Setup = { id: string; label: string; logo: string; panel: ReactNode };

const KEY = 'motionrig-site:setup';

/**
 * One complete setup per stack behind tabs, the first shown by default. `#setup-<id>` opens
 * its tab, from a link on this page or another one; a tab picked by hand is remembered.
 */
export function SetupTabs({ setups }: { setups: Setup[] }) {
  const id = useId();
  const [active, setActive] = useState(setups[0]!.id);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // After hydration, so it matches the server's default, but before paint: Back and reload
  // restore a scroll offset measured with this tab open. The hash wins, then the pick.
  useLayoutEffect(() => {
    const fromHash = () => {
      const hit = setups.find((x) => location.hash === `#setup-${x.id}`);
      if (hit) setActive(hit.id);
      return !!hit;
    };
    if (!fromHash()) {
      try {
        const v = localStorage.getItem(KEY);
        if (setups.some((x) => x.id === v)) setActive(v!);
      } catch {}
    }
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [setups]);

  const pick = (next: string) => {
    setActive(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    // A #setup-<id> URL follows the pick, or Back would reopen the tab the hash names; the
    // router's state goes along unchanged, so Next leaves the entry alone.
    if (history.state && location.hash.startsWith('#setup-')) {
      history.replaceState(history.state, '', `#setup-${next}`);
    }
  };

  const at = setups.findIndex((x) => x.id === active);

  const onKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (at + step + setups.length) % setups.length;
    pick(setups[next]!.id);
    tabs.current[next]?.focus();
  };

  return (
    <div className={d.setup}>
      {/* Link targets that are always laid out, whichever tab is open. */}
      {setups.map((x) => (
        <span key={x.id} id={`setup-${x.id}`} className={d.setupTarget} />
      ))}
      <div className={d.setupTabs} role="tablist" aria-label="Setup" onKeyDown={onKey}>
        {setups.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-${x.id}`}
            aria-selected={x.id === active}
            aria-controls={`${id}-${x.id}-pane`}
            tabIndex={x.id === active ? 0 : -1}
            onClick={() => pick(x.id)}
          >
            <svg className={d.setupLogo} viewBox="0 0 24 24" aria-hidden="true">
              <path d={x.logo} />
            </svg>
            {x.label}
          </button>
        ))}
      </div>
      {setups.map((x) => (
        <div
          key={x.id}
          className={d.setupPane}
          role="tabpanel"
          id={`${id}-${x.id}-pane`}
          aria-labelledby={`${id}-${x.id}`}
          hidden={x.id !== active}
        >
          {x.panel}
        </div>
      ))}
    </div>
  );
}
