'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import s from './Feed.module.css';
import { FEED, onReplay } from './feed.rig';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const EVENTS = ['Deployed to staging', 'Panel opened', 'Link shared'];

export function Feed() {
  const list = useRef<HTMLUListElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // FEED is read each time a tween is made, so a replay shows every
      // value tuned since the last one.
      const enter = (scrollTrigger?: ScrollTrigger.Vars) =>
        gsap.from('li', {
          y: FEED.y,
          autoAlpha: 0,
          duration: FEED.duration,
          stagger: FEED.stagger,
          ease: FEED.ease,
          scrollTrigger,
        });
      let tween = enter({ trigger: list.current, start: 'top 80%' });
      return onReplay(
        contextSafe!(() => {
          tween.revert();
          tween = enter();
        }),
      );
    },
    { scope: list },
  );

  return (
    <ul ref={list} className={s.feed} data-rig="feed">
      {EVENTS.map((event) => (
        <li key={event}>{event}</li>
      ))}
    </ul>
  );
}
