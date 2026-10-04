'use client';

import { configure } from 'motionrig';
import dynamic from 'next/dynamic';
import { type ComponentType, useEffect, useRef, useState } from 'react';
import { Cards } from '@/examples/css-transition/Cards';
import { Wave } from '@/examples/canvas/Wave';
import { Feed } from '@/examples/gsap-from/Feed';
import { replayFeed } from '@/examples/gsap-from/feed.rig';
import { Toast } from '@/examples/gsap-timeline/Toast';
import { Pulse } from '@/examples/keyframes/Pulse';
// Motion is the heaviest demo dependency: its component loads when the stage nears the
// viewport, while its rig registers up front so the panel lists it and Tune works anyway.
import '@/examples/motion-spring/tabs.rig';
import '@/examples/gsap-composite/gallery.rig';
import { Accordion } from '@/examples/react-state/Accordion';
import { EXAMPLES } from '@/examples/registry';
import { Parallax } from '@/examples/scroll-scrub/Parallax';
import { Dots } from '@/examples/waapi/Dots';
import '@/motion/motion';
import s from './Examples.module.css';

const Tabs = dynamic(() => import('@/examples/motion-spring/Tabs').then((m) => m.Tabs), { ssr: false });
const Gallery = dynamic(() => import('@/examples/gsap-composite/Gallery').then((m) => m.Gallery), { ssr: false });

type Demo = { Demo: ComponentType; replay?: () => void; lazy?: boolean; fill?: boolean; tall?: boolean };

const DEMOS: Record<string, Demo> = {
  'css-transition': { Demo: Cards },
  keyframes: { Demo: Pulse },
  'gsap-from': { Demo: Feed, replay: replayFeed },
  'gsap-timeline': { Demo: Toast, fill: true },
  'scroll-scrub': { Demo: Parallax, fill: true },
  'motion-spring': { Demo: Tabs, lazy: true },
  waapi: { Demo: Dots },
  canvas: { Demo: Wave, fill: true },
  'react-state': { Demo: Accordion },
  'gsap-composite': { Demo: Gallery, lazy: true, tall: true },
};

// Panel tabs in page order.
configure({ order: EXAMPLES.map((e) => e.rig) });

/**
 * The stage a recipe runs on. Off screen it pauses the infinite CSS and WAAPI
 * animations inside it; the JS loops (GSAP, canvas) pause themselves, as their
 * code shows.
 */
export function ExampleDemo({ slug, engine }: { slug: string; engine: string }) {
  const { Demo, replay, lazy, fill, tall } = DEMOS[slug]!;
  const stage = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(!lazy);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const held = new Set<Animation>();
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        // An animation cancelled while held (a WAAPI rebuild) is gone for good: don't revive it.
        held.forEach((a) => a.playState !== 'idle' && a.play());
        held.clear();
        return;
      }
      for (const a of el.getAnimations({ subtree: true })) {
        if (a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity) {
          a.pause();
          held.add(a);
        }
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (near || !el) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setNear(true), { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return (
    <div ref={stage} className={s.stage} data-tall={tall || undefined}>
      <span className={s.engine}>{engine}</span>
      {replay && (
        <button type="button" className={s.replay} onClick={replay}>
          <span aria-hidden="true">▶</span> Replay
        </button>
      )}
      <div className={s.demo} data-fill={fill || undefined}>
        {near && <Demo />}
      </div>
    </div>
  );
}
