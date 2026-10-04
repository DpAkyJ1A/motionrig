'use client';

import {
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react';
import { useRig } from 'motionrig/react';
import { useEffect, useRef, useState } from 'react';
import s from './Tabs.module.css';
import { TABS } from './tabs.rig';

const ITEMS = ['Timing', 'Curves', 'Distance'];

export function Tabs() {
  // Values used in render go through useRig: an edit re-renders, and
  // the next transition Motion runs uses the new spring.
  const { visualDuration, bounce, cycle } = useRig(TABS);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduce = useReducedMotion();

  // Advances on its own while on screen, so the spring keeps showing.
  useEffect(() => {
    if (!inView || reduce) return;
    const next = () => setActive((i) => (i + 1) % ITEMS.length);
    const id = setInterval(next, cycle * 1000);
    return () => clearInterval(id);
  }, [inView, reduce, cycle]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} className={s.tabs} data-rig="tabs">
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
                transition={{ type: 'spring', visualDuration, bounce }}
              />
            )}
            <span className={s.label}>{item}</span>
          </button>
        ))}
      </div>
    </MotionConfig>
  );
}
