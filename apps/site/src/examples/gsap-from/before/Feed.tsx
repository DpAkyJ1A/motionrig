'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import s from './Feed.module.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const EVENTS = ['Deployed to staging', 'Panel opened', 'Link shared'];

export function Feed() {
  const list = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.from('li', {
        y: 28,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: list.current, start: 'top 80%' },
      });
    },
    { scope: list },
  );

  return (
    <ul ref={list} className={s.feed}>
      {EVENTS.map((event) => (
        <li key={event}>{event}</li>
      ))}
    </ul>
  );
}
