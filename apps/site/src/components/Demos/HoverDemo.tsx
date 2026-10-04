'use client';

import { Ring } from '@/components/Ring/Ring';
import s from './Demos.module.css';
// Registers the rig; the cards themselves only read CSS custom properties.
import './hover.rig';

// Three copies of one card: each reads every --hover-* property.
const CARDS = [1, 2, 3];

export function HoverDemo() {
  return (
    <div className={s.hover} data-rig="hover">
      {CARDS.map((n) => (
        <div key={n} className={s.card} tabIndex={0} role="group" aria-label={`Card ${n} of 3: hover, focus or tap it`}>
          <Ring size={34} className={s.cardRing} strokeWidth={1.6} />
          <code>--hover-*</code>
        </div>
      ))}
    </div>
  );
}
