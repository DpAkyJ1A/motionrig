'use client';

import { subscribe } from 'motionrig';
import { useEffect, useRef } from 'react';
import { DOTS } from './dots.rig';
import s from './Dots.module.css';

export function Dots() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dots = [...root.current!.children];
    let animations: Animation[] = [];
    // An Animation keeps the timing it was made with: on every edit,
    // cancel and make new ones from the current DOTS.
    const start = () => {
      animations.forEach((a) => a.cancel());
      animations = dots.map((dot, i) =>
        dot.animate(
          [
            { translate: '0 0' },
            { translate: `0 ${-DOTS.height}px` },
            { translate: '0 0' },
          ],
          {
            duration: DOTS.duration,
            delay: i * DOTS.stagger,
            easing: DOTS.easing,
            iterations: Infinity,
          },
        ),
      );
    };
    start();
    const unsubscribe = subscribe(DOTS, start);
    return () => {
      unsubscribe();
      animations.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <div
      ref={root}
      className={s.dots}
      role="img"
      aria-label="Typing"
      data-rig="dots"
    >
      <span />
      <span />
      <span />
    </div>
  );
}
