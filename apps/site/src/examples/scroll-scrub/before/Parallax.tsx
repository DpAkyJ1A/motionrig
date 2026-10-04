'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import s from './Parallax.module.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LAYERS = ['back', 'middle', 'front'];

export function Parallax() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Deeper layers travel less: 1/3, 2/3 and all of the depth.
      gsap.fromTo(
        '[data-layer]',
        { y: (i) => (120 * (i + 1)) / 6 },
        {
          y: (i) => (-120 * (i + 1)) / 6,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 85%',
            end: 'bottom 15%',
            scrub: 0.6,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.stage}>
      {LAYERS.map((layer) => (
        <span key={layer} className={s[layer]} data-layer />
      ))}
    </div>
  );
}
