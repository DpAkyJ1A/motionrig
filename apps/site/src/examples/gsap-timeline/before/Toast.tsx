'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import s from './Toast.module.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Toast() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap
        .timeline({
          repeat: -1,
          repeatDelay: 0.6,
          // Plays only while on screen.
          scrollTrigger: {
            trigger: root.current,
            toggleActions: 'play pause resume pause',
          },
        })
        .from('[data-card]', {
          xPercent: 115,
          duration: 0.7,
          ease: 'expo.out',
        })
        .from(
          '[data-line]',
          {
            y: 12,
            autoAlpha: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power3.out',
          },
          '<0.2',
        )
        .from('[data-progress]', { scaleX: 0, duration: 1.8, ease: 'none' })
        .to('[data-card]', {
          xPercent: 115,
          autoAlpha: 0,
          duration: 0.45,
          ease: 'power2.in',
        });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.stage}>
      <div className={s.card} data-card>
        <p className={s.title} data-line>
          Values applied
        </p>
        <p className={s.text} data-line>
          3 changes written to hero.ts
        </p>
        <span className={s.progress} data-progress />
      </div>
    </div>
  );
}
