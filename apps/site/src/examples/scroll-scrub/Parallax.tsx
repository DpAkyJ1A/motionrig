'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import s from './Parallax.module.css';
import { onRebuild, PARALLAX } from './parallax.rig';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LAYERS = ['back', 'middle', 'front'];

export function Parallax() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let tween: gsap.core.Tween | undefined;
      // revert() also kills the old ScrollTrigger, so edits never stack.
      const build = contextSafe!(() => {
        tween?.revert();
        // Deeper layers travel less: 1/3, 2/3 and all of the depth.
        const { start, end, scrub, depth } = PARALLAX;
        tween = gsap.fromTo(
          '[data-layer]',
          { y: (i) => (depth * (i + 1)) / 6 },
          {
            y: (i) => (-depth * (i + 1)) / 6,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: `top ${start}%`,
              end: `bottom ${end}%`,
              scrub: scrub || true,
            },
          },
        );
      });
      build();
      return onRebuild(build);
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.stage} data-rig="parallax">
      {LAYERS.map((layer) => (
        <span key={layer} className={s[layer]} data-layer />
      ))}
    </div>
  );
}
