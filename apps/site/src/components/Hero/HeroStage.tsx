'use client';

import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/motion/motion';
import s from './Hero.module.css';
import { HERO, setHeroReplay } from './hero.rig';

type StaggerFrom = 'start' | 'center' | 'end' | 'edges' | 'random';

/**
 * The headline and the viewport floor. The first intro is CSS (whole lines, visible from the first frame);
 * every replay is the per-letter GSAP version driven by rig('hero'). Never re-renders: SplitText owns the title's DOM.
 */
export function HeroStage() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current;
      const title = el?.querySelector('h1');
      const ring = el?.querySelector<SVGGElement>('[data-ring]');
      const stroke = el?.querySelector<SVGCircleElement>('[data-ring-stroke]');
      if (!el || !title || !ring || !stroke || !contextSafe) return;

      let split: SplitText | undefined;
      let tl: gsap.core.Timeline | undefined;

      // Reads HERO at play time, so a tuned value shows on the next play.
      const play = contextSafe(() => {
        // Hands the headline over from the CSS intro for good.
        el.dataset.played = '';
        split ??= SplitText.create(title, { type: 'words,chars', wordsClass: s.word });
        tl?.kill();
        const pieces = HERO.split === 'words' ? split.words : split.chars;
        gsap.set([...split.words, ...split.chars], { clearProps: 'transform,opacity' });
        gsap.set(pieces, { transformPerspective: 600, transformOrigin: '50% 100%' });
        tl = gsap
          .timeline()
          .fromTo(
            pieces,
            { yPercent: HERO.rise, rotationX: HERO.tilt, rotation: HERO.spin, opacity: 0 },
            {
              yPercent: 0,
              rotationX: 0,
              rotation: 0,
              opacity: 1,
              duration: HERO.duration,
              ease: HERO.ease,
              stagger: { each: HERO.stagger, from: HERO.from as StaggerFrom },
            },
            0,
          )
          .fromTo(stroke, { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: HERO.ring.draw, ease: HERO.ease }, HERO.ring.delay)
          .fromTo(
            ring,
            { rotation: -HERO.ring.turn, svgOrigin: '0 0' },
            { rotation: 0, svgOrigin: '0 0', duration: HERO.ring.draw, ease: HERO.ease },
            HERO.ring.delay,
          );
      });

      return setHeroReplay(play);
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.stage}>
      <div className={s.floor} aria-hidden="true">
        <div className={s.plane} />
      </div>
      <div className={s.origin} aria-hidden="true">
        {/* A floor ring seen from above: the circle is squashed, the stroke is not. */}
        <svg className={s.root} viewBox="-1000 -200 2000 400">
          <defs>
            {/* The far half fades, so the arc behind the headline reads as depth, not a strike-through. */}
            <linearGradient id="hero-ring-depth" x1="0" y1="-960" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="1" stopColor="#fff" />
            </linearGradient>
            <mask id="hero-ring-fade" maskUnits="userSpaceOnUse" x="-1200" y="-1200" width="2400" height="2400">
              <rect x="-1200" y="-1200" width="2400" height="2400" fill="url(#hero-ring-depth)" />
            </mask>
          </defs>
          <g transform="scale(1 0.17)">
            <g mask="url(#hero-ring-fade)">
              <g className={s.ring} data-ring>
                <circle className={s.rootStroke} r="960" pathLength={1000} transform="rotate(-90)" data-ring-stroke />
                <path className={s.rootNotch} d="M0 -960V-1110" />
              </g>
            </g>
            <circle className={s.rootDot} r="22" />
          </g>
        </svg>
      </div>
      <h1 id="hero-title" className={s.title} data-rig="hero type">
        <span className={s.line}>Devs rig it.</span> <span className={s.line}>Designers play it.</span>
      </h1>
    </div>
  );
}
