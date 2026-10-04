'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from '@/motion/motion';

/**
 * ScrollTrigger measures its start and end once. A file tab or the Diff / Final
 * toggle changes a code pane's height and moves everything below it, which a
 * window resize would never report: watch the column instead and re-measure.
 */
export function RefreshOnResize({ target }: { target: string }) {
  useEffect(() => {
    const el = document.querySelector(target);
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [target]);
  return null;
}
