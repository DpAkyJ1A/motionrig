'use client';

import { useEffect, useRef } from 'react';

const WAVE = {
  lines: 6,
  amplitude: 34,
  frequency: 1.6,
  speed: 1.2,
  spread: 0.5,
  width: 1.5,
  color: '#ffd400',
};

export function Wave() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;

    const draw = (time: number) => {
      const { lines, amplitude, frequency, speed, spread } = WAVE;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = WAVE.color;
      ctx.lineWidth = WAVE.width;
      const t = (time / 1000) * speed;
      for (let k = 0; k < lines; k++) {
        ctx.globalAlpha = 1 - k / (lines + 1);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const a = (x / w) * frequency * Math.PI * 2 + t + k * spread;
          ctx.lineTo(x, h / 2 + Math.sin(a) * amplitude * (1 - k / 12));
        }
        ctx.stroke();
      }
    };
    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    // Size the bitmap only when the box changes, never per frame.
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(devicePixelRatio, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    });
    // Off screen the loop stops; reduced motion keeps the still frame.
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry?.isIntersecting && !reduce) {
        raf = requestAnimationFrame(loop);
      }
    });
    ro.observe(canvas);
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} role="img" aria-label="Moving sine waves" />;
}
