'use client';

import { useRig } from 'motionrig/react';
import { useEffect, useRef, useState } from 'react';
import { Ring } from '@/components/Ring/Ring';
import { gsap, prefersReducedMotion, useGSAP } from '@/motion/motion';
import s from './Demos.module.css';
import { TIMELINE } from './timeline.rig';

const STEPS = ['rise', 'travel', 'settle'] as const;

/** Bar heights as a fraction of the stage: a fixed, pleasant wave. */
const height = (i: number) => 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(i * 1.3 + 0.6));

/** Timeline position `overlap` seconds before the previous step ends (negative = a gap). */
const after = (overlap: number) => (overlap >= 0 ? `>-${overlap}` : `>+${-overlap}`);

export function TimelineDemo() {
  const t = useRig(TIMELINE);
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline>(undefined);
  const [paused, setPaused] = useState(false);
  const chosen = useRef<boolean>(undefined);
  // The ring's path is measured from the bars, so a new stage size means a new timeline.
  const [size, setSize] = useState('');
  const built = useRef('');
  const visible = useRef(false);

  const held = () => chosen.current ?? prefersReducedMotion();
  const sync = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (visible.current && !held()) tl.play();
    else tl.pause();
  };

  useGSAP(
    () => {
      const el = root.current;
      const stage = el?.querySelector<HTMLElement>('[data-stage]');
      const ring = el?.querySelector<HTMLElement>('[data-ring]');
      const head = el?.querySelector<HTMLElement>('[data-playhead]');
      if (!el || !stage || !ring || !head) return;
      const bars = gsap.utils.toArray<HTMLElement>('[data-bar]', el);
      built.current = `${stage.clientWidth}x${stage.clientHeight}`;

      const tops = bars.map((b) => ({ x: b.offsetLeft + b.offsetWidth / 2, y: stage.clientHeight - b.offsetHeight }));
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: t.hold,
        yoyo: t.yoyo,
        onUpdate: () => void gsap.set(head, { xPercent: tl.progress() * 100 }),
      });
      tl.addLabel('rise', 0)
        .fromTo(bars, { scaleY: 0.04 }, { scaleY: 1, duration: t.rise.duration, stagger: t.rise.stagger, ease: t.rise.ease }, 'rise')
        .addLabel('travel', after(t.travel.overlap))
        .fromTo(ring, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.2 }, 'travel')
        .fromTo(
          ring,
          { x: tops[0]?.x ?? 0, y: tops[0]?.y ?? 0 },
          {
            keyframes: { x: tops.map((p) => p.x), y: tops.map((p) => p.y), easeEach: 'none' },
            duration: t.travel.duration,
            ease: t.travel.ease,
          },
          'travel',
        )
        .addLabel('settle', after(t.settle.overlap))
        .to(bars, { scaleY: 0.04, duration: t.settle.duration, stagger: { each: t.settle.stagger, from: 'end' }, ease: t.settle.ease }, 'settle')
        .to(ring, { opacity: 0, scale: 0.4, duration: t.settle.duration, ease: t.settle.ease }, 'settle');

      // The strip under the pane: where each step sits inside one loop.
      const total = tl.duration();
      const at = (label: string) => tl.labels[label] ?? 0;
      const spans: Record<(typeof STEPS)[number], [number, number]> = {
        rise: [0, t.rise.duration + Math.max(0, bars.length - 1) * t.rise.stagger],
        travel: [at('travel'), at('travel') + t.travel.duration],
        settle: [at('settle'), total],
      };
      for (const step of STEPS) {
        const [a, b] = spans[step];
        const span = el.querySelector<HTMLElement>(`[data-span="${step}"]`);
        if (span) gsap.set(span, { left: `${(a / total) * 100}%`, width: `${((b - a) / total) * 100}%` });
      }

      tlRef.current = tl;
      if (held()) tl.progress(0.55);
      sync();
      setPaused(held());
    },
    { scope: root, dependencies: [t, size], revertOnUpdate: true },
  );

  useEffect(() => {
    const el = root.current;
    const stage = el?.querySelector<HTMLElement>('[data-stage]');
    if (!el || !stage) return;
    const ro = new ResizeObserver(() => {
      const next = `${stage.clientWidth}x${stage.clientHeight}`;
      if (next !== built.current) setSize(next);
    });
    ro.observe(stage);
    // Off-screen, the loop stops instead of ticking for nobody.
    const io = new IntersectionObserver(([entry]) => {
      visible.current = !!entry?.isIntersecting;
      sync();
    });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const toggle = () => {
    chosen.current = !held();
    setPaused(chosen.current);
    sync();
  };

  return (
    <div ref={root} className={s.timeline} data-rig="timeline">
      <div className={s.stageBars} data-stage>
        {Array.from({ length: t.bars }, (_, i) => (
          <span key={i} className={s.bar} data-bar style={{ height: `${height(i) * 100}%` }} />
        ))}
        <span className={s.rider} data-ring>
          <Ring size={22} />
        </span>
      </div>
      <div className={s.dope} aria-hidden="true">
        {STEPS.map((step) => (
          <div key={step} className={s.track}>
            <span className={s.trackName}>{step}</span>
            <span className={s.trackLane}>
              <i data-span={step} />
            </span>
          </div>
        ))}
        <span className={s.headLane}>
          <b data-playhead />
        </span>
      </div>
      <button type="button" className={s.pause} onClick={toggle}>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}
