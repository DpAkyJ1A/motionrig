'use client';

import { useRig } from 'motionrig/react';
import { useEffect, useRef } from 'react';
import { Ring } from '@/components/Ring/Ring';
import { gsap, ScrollTrigger, useGSAP } from '@/motion/motion';
import s from './Demos.module.css';
import { SCRUB } from './scrub.rig';

export function ScrubDemo() {
  const sc = useRig(SCRUB);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const ring = el?.querySelector<HTMLElement>('[data-ring]');
      const fill = el?.querySelector<HTMLElement>('[data-fill]');
      const readout = el?.querySelector<HTMLElement>('[data-progress]');
      const rail = el?.querySelector<HTMLElement>('[data-rail]');
      if (!el || !ring || !fill || !readout || !rail) return;
      const travel = () => rail.clientWidth - ring.offsetWidth;

      const tl = gsap.timeline({
        defaults: { ease: sc.ease },
        scrollTrigger: {
          trigger: el,
          start: `top ${sc.start}%`,
          end: `bottom ${sc.end}%`,
          scrub: sc.smooth > 0 ? sc.smooth : true,
          markers: sc.markers,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          readout.textContent = tl.progress().toFixed(2);
        },
      });
      tl.fromTo(ring, { x: 0, rotation: 0 }, { x: travel, rotation: sc.spin }, 0).fromTo(fill, { scaleX: 0 }, { scaleX: 1 }, 0);
    },
    { scope: root, dependencies: [sc], revertOnUpdate: true },
  );

  // Rigs like `type` reflow the page without resizing the window, which ScrollTrigger would not notice.
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(main);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={root} className={s.scrub} data-rig="scrub">
      <p className={s.readout}>
        progress <b data-progress>0.00</b>
      </p>
      <div className={s.rail} data-rail>
        <span className={s.fill} data-fill />
        <span className={s.roller} data-ring>
          <Ring size={44} strokeWidth={1.6} />
        </span>
      </div>
      <p className={s.hint}>
        Scroll the page. The ride runs from <code>top {sc.start}%</code> to <code>bottom {sc.end}%</code>,{' '}
        {sc.smooth > 0 ? `catching up in ${sc.smooth}s` : 'locked to the scrollbar'}.
      </p>
    </div>
  );
}
