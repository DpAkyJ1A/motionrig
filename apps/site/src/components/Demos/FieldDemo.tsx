'use client';

import { subscribe } from 'motionrig';
import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/motion/motion';
import s from './Demos.module.css';
import { FIELD } from './field.rig';

const TAU = Math.PI * 2;

export function FieldDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const chosen = useRef<boolean>(undefined);
  const resume = useRef<() => void>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const hold = chosen.current ?? prefersReducedMotion();
    pausedRef.current = hold;
    setPaused(hold);

    let w = 0;
    let h = 0;
    let visible = false;
    let raf = 0;
    let t = 0;
    const pointer = { x: 0, y: 0, active: false };
    const pull = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pull.x && !pull.y) Object.assign(pull, { x: w * 0.62, y: h * 0.45 });
    };

    // Everything below reads FIELD directly, every frame: that is what makes edits live.
    const draw = () => {
      const { spacing, length, width, color, radius, follow, autopilot } = FIELD;
      if (!pointer.active && autopilot && !pausedRef.current) {
        t += 0.012;
        pointer.x = w / 2 + Math.cos(t) * w * 0.3;
        pointer.y = h / 2 + Math.sin(t * 1.7) * h * 0.28;
      }
      pull.x += (pointer.x - pull.x) * follow;
      pull.y += (pointer.y - pull.y) * follow;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      const step = Math.max(6, spacing);
      const ox = ((w % step) + step) / 2;
      const oy = ((h % step) + step) / 2;
      for (let y = oy; y < h; y += step) {
        for (let x = ox; x < w; x += step) {
          const dx = pull.x - x;
          const dy = pull.y - y;
          const k = Math.max(0, 1 - Math.hypot(dx, dy) / Math.max(1, radius));
          const len = 1.5 + (length - 1.5) * k;
          const a = Math.atan2(dy, dx);
          ctx.globalAlpha = 0.16 + 0.84 * k;
          ctx.beginPath();
          ctx.moveTo(x - (Math.cos(a) * len) / 2, y - (Math.sin(a) * len) / 2);
          ctx.lineTo(x + (Math.cos(a) * len) / 2, y + (Math.sin(a) * len) / 2);
          ctx.stroke();
        }
      }
      // The pull point wears the rig ring.
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pull.x, pull.y, 11, 0, TAU);
      ctx.moveTo(pull.x, pull.y - 11);
      ctx.lineTo(pull.x, pull.y - 17);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pull.x, pull.y, 2.6, 0, TAU);
      ctx.fill();
    };

    const loop = () => {
      draw();
      raf = visible && !pausedRef.current ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      Object.assign(pointer, { x: e.clientX - r.left, y: e.clientY - r.top, active: true });
      if (!pausedRef.current) return start();
      Object.assign(pull, pointer);
      draw();
    };
    const onLeave = () => {
      pointer.active = false;
    };

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    resume.current = start;
    // While paused nothing loops, so an edit from the panel redraws one frame.
    const unsubscribe = subscribe(FIELD, () => {
      if (!raf) draw();
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      unsubscribe();
    };
  }, []);

  const toggle = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    chosen.current = next;
    setPaused(next);
    if (!next) resume.current?.();
  };

  return (
    <div className={s.field}>
      <canvas ref={canvasRef} className={s.canvas} data-rig="field" aria-label="Needles that turn toward the cursor" role="img" />
      <button type="button" className={s.pause} onClick={toggle}>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}
