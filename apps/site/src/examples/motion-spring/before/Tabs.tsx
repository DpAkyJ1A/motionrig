'use client';

import {
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import s from './Tabs.module.css';

const ITEMS = ['Timing', 'Curves', 'Distance'];

export function Tabs() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();

  // Advances on its own while on screen, so the spring keeps showing.
  useEffect(() => {
    if (!inView || reduce) return;
    const next = () => setActive((i) => (i + 1) % ITEMS.length);
    const id = setInterval(next, 1600);
    return () => clearInterval(id);
  }, [inView, reduce]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} className={s.tabs}>
        {ITEMS.map((item, i) => (
          <button
            key={item}
            type="button"
            className={s.tab}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            {i === active && (
              <motion.span
                layoutId="tabs-pill"
                className={s.pill}
                transition={{
                  type: 'spring',
                  visualDuration: 0.45,
                  bounce: 0.3,
                }}
              />
            )}
            <span className={s.label}>{item}</span>
          </button>
        ))}
      </div>
    </MotionConfig>
  );
}
