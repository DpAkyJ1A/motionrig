'use client';

import { useRig } from 'motionrig/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { ACCORDION } from './accordion.rig';
import s from './Accordion.module.css';

const ROWS = [
  { q: 'Does it ship to visitors?', a: 'Only the core; the panel waits for ?rig.' },
  { q: 'Who can open the panel?', a: 'Anyone with ?rig. It is not a lock.' },
  { q: 'How do values get back?', a: 'Copy code, a share link, or the CLI.' },
];

export function Accordion() {
  const [open, setOpen] = useState(0);
  // Rendered values come from useRig: the next toggle uses whatever was tuned.
  const { duration, ease, fade, delay } = useRig(ACCORDION);
  const list = useRef<HTMLDivElement>(null);
  const tops = useRef<number[]>(null);

  // FLIP: React state changes the layout once; the rows then glide from where they were
  // with transforms only, so no frame of the animation re-runs layout.
  const moving = () => [...(list.current?.querySelectorAll<HTMLElement>('[data-move]') ?? [])];
  const toggle = (i: number) => {
    tops.current = moving().map((el) => el.getBoundingClientRect().top);
    setOpen(i === open ? -1 : i);
  };

  useLayoutEffect(() => {
    const before = tops.current;
    tops.current = null;
    if (!before || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    moving().forEach((el, k) => {
      const dy = before[k]! - el.getBoundingClientRect().top;
      if (dy) el.animate([{ translate: `0 ${dy}px` }, { translate: '0 0' }], { duration: duration * 1000, easing: ease });
    });
    list.current?.querySelector('[data-answer]')?.animate([{ opacity: 0, translate: '0 -6px' }, { opacity: 1, translate: '0 0' }], {
      duration: fade * 1000,
      delay: delay * 1000,
      easing: 'ease-out',
      fill: 'backwards',
    });
  }, [open, duration, ease, fade, delay]);

  return (
    <div ref={list} className={s.list} data-rig="accordion">
      {ROWS.map((row, i) => (
        <div key={row.q} className={s.row} data-open={i === open} data-move>
          <button type="button" aria-expanded={i === open} aria-controls={`answer-${i}`} onClick={() => toggle(i)}>
            {row.q}
          </button>
          <p id={`answer-${i}`} hidden={i !== open} data-answer={i === open || undefined}>
            {row.a}
          </p>
        </div>
      ))}
      <span className={s.end} data-move />
    </div>
  );
}
