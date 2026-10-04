import type { CSSProperties } from 'react';
import s from './Pulse.module.css';
import './pulse.rig';

export function Pulse() {
  return (
    <div className={s.pulse} role="img" aria-label="Live" data-rig="pulse">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={s.ring}
          style={{ '--i': i } as CSSProperties}
        />
      ))}
      <span className={s.dot} />
    </div>
  );
}
