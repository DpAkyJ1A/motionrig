'use client';

import { useEffect, useRef } from 'react';
import s from './Dots.module.css';

export function Dots() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dots = [...root.current!.children];
    const animations = dots.map((dot, i) =>
      dot.animate(
        [
          { translate: '0 0' },
          { translate: '0 -10px' },
          { translate: '0 0' },
        ],
        {
          duration: 1100,
          delay: i * 140,
          easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
          iterations: Infinity,
        },
      ),
    );
    return () => animations.forEach((a) => a.cancel());
  }, []);

  return (
    <div ref={root} className={s.dots} role="img" aria-label="Typing">
      <span />
      <span />
      <span />
    </div>
  );
}
