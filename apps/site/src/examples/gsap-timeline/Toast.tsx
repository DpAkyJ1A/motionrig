'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRig } from 'motionrig/react';
import { useRef } from 'react';
import s from './Toast.module.css';
import { TOAST } from './toast.rig';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Toast() {
  const root = useRef<HTMLDivElement>(null);
  // A new snapshot on every edit: the dependency rebuilds the timeline.
  const t = useRig(TOAST);

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap
        .timeline({
          repeat: -1,
          repeatDelay: t.hold,
          // Plays only while on screen.
          scrollTrigger: {
            trigger: root.current,
            toggleActions: 'play pause resume pause',
          },
        })
        .from('[data-card]', {
          xPercent: 115,
          duration: t.enter.duration,
          ease: t.enter.ease,
        })
        .from(
          '[data-line]',
          {
            y: 12,
            autoAlpha: 0,
            duration: t.lines.duration,
            stagger: t.lines.stagger,
            ease: t.lines.ease,
          },
          `<${t.lines.delay}`,
        )
        .from('[data-progress]', {
          scaleX: 0,
          duration: t.progress.duration,
          ease: t.progress.ease,
        })
        .to('[data-card]', {
          xPercent: 115,
          autoAlpha: 0,
          duration: t.exit.duration,
          ease: t.exit.ease,
        });
    },
    { scope: root, dependencies: [t], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={s.stage} data-rig="toast">
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
