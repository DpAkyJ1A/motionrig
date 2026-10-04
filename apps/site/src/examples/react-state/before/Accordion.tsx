'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import s from './Accordion.module.css';

const ROWS = [
  { q: 'Does it ship to visitors?', a: 'Only the core; the panel waits for ?rig.' },
  { q: 'Who can open the panel?', a: 'Anyone with ?rig. It is not a lock.' },
  { q: 'How do values get back?', a: 'Copy code, a share link, or the CLI.' },
];

export function Accordion() {
  const [open, setOpen] = useState(0);
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
      if (dy) el.animate([{ translate: `0 ${dy}px` }, { translate: '0 0' }], { duration: 450, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
    });
    list.current?.querySelector('[data-answer]')?.animate([{ opacity: 0, translate: '0 -6px' }, { opacity: 1, translate: '0 0' }], {
      duration: 250,
      delay: 100,
      easing: 'ease-out',
      fill: 'backwards',
    });
  }, [open]);

  return (
    <div ref={list} className={s.list}>
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
