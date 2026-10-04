'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Two fixes for Back and Forward in the App Router.
 *
 * A plain `#hash` link pushes a history entry without the router's state, and Next ignores
 * a traversal to such an entry: from /docs, Back to /#features changed the URL but left the
 * docs on screen. Each new hash entry gets a copy of the state of the page it was made on.
 *
 * `scroll-behavior: smooth` also animates the browser's scroll restoration, and the restored
 * page's first DOM updates cut that animation short, so Back landed sections away from where
 * it left. Next only turns smooth scrolling off for its own scrolls; this does it for the
 * traversal, whose restore lands within a frame of popstate.
 */
export function BackForward() {
  const pathname = usePathname();

  useEffect(() => {
    // Next writes its entry before effects run, so this is the state of the page on screen.
    const page: unknown = history.state;
    const where = location.pathname + location.search;
    if (!page || typeof page !== 'object' || !('__NA' in page)) return;

    const stamp = () => {
      // A hash change that is a Back to some other page's entry is left alone.
      if (history.state == null && location.pathname + location.search === where) {
        history.replaceState({ ...page }, '', location.href);
      }
    };
    window.addEventListener('hashchange', stamp);
    return () => window.removeEventListener('hashchange', stamp);
  }, [pathname]);

  useEffect(() => {
    const html = document.documentElement;
    let pending = 0;
    let inline = '';
    const instant = () => {
      // Put back as found: ScrollTrigger writes an inline value of its own.
      if (!pending) inline = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        pending = requestAnimationFrame(() => {
          pending = 0;
          html.style.scrollBehavior = inline;
        });
      });
    };
    window.addEventListener('popstate', instant);
    return () => window.removeEventListener('popstate', instant);
  }, []);

  return null;
}
