'use client';

import { type ReactNode, useEffect, useRef } from 'react';

/**
 * Arms its children's entrance once hydrated, then plays it when the block scrolls into view.
 * Without JavaScript, or with reduced motion, it never arms: everything simply shows.
 */
export function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    node.dataset.armed = '';
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        node.dataset.on = '';
        io.disconnect();
      },
      // Once its top clears the bottom quarter of the viewport. Not a visible share: a block taller
      // than the viewport can hold (a landscape phone) would never show enough of itself to play.
      { rootMargin: '0px 0px -25% 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={el} className={className}>
      {children}
    </div>
  );
}
