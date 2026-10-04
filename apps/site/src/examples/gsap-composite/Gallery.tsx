'use client';

import gsap from 'gsap';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import s from './Gallery.module.css';
import { GALLERY, onToggle } from './gallery.rig';

type View = 'grid' | 'list';

const PROJECTS = [
  { title: 'Northwind', meta: '2026 · Brand site', views: 1240, hue: 46 },
  { title: 'Halcyon', meta: '2025 · Product', views: 860, hue: 200 },
  { title: 'Ferrous', meta: '2025 · Campaign', views: 2310, hue: 12 },
  { title: 'Lumen Atlas', meta: '2024 · Editorial', views: 540, hue: 160 },
  { title: 'Orbital', meta: '2024 · WebGL', views: 3980, hue: 260 },
  { title: 'Kiln', meta: '2023 · Identity', views: 720, hue: 28 },
];

// The thumbs' corner radius in CSS: kept visually constant while a thumb is scaled.
const RADIUS = 8;

export function Gallery() {
  const root = useRef<HTMLDivElement>(null);
  // The view the buttons report: the target, from the click on, not the layout mid-switch.
  const [view, setView] = useState<View>('grid');
  const tl = useRef<gsap.core.Timeline>(null);

  const play = (to: View) => {
    const el = root.current;
    // A switch still running finishes first, so every measurement starts from a settled layout.
    tl.current?.progress(1).kill();
    if (!el || el.dataset.view === to) return;
    setView(to);
    const q = gsap.utils.selector(el);
    const thumbs = q('[data-thumb]');
    const pill = { xPercent: to === 'list' ? 100 : 0 };
    const label = { yPercent: to === 'list' ? -50 : 0 };
    const swap = () => void (el.dataset.view = to);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(q('[data-pill]'), pill);
      gsap.set(q('[data-label]'), label);
      return swap();
    }

    // FLIP, measured up front: every thumb's box now and in the other layout.
    const from = thumbs.map((t) => t.getBoundingClientRect());
    swap();
    const inverse = thumbs.map((t, i) => {
      const a = from[i]!;
      const b = t.getBoundingClientRect();
      const sx = a.width / b.width;
      const sy = a.height / b.height;
      return { x: a.left - b.left, y: a.top - b.top, scaleX: sx, scaleY: sy, borderRadius: `${RADIUS / sx}px / ${RADIUS / sy}px` };
    });
    el.dataset.view = to === 'list' ? 'grid' : 'list';

    // Read at play time: the next switch uses whatever the designer just tuned.
    const { speed, chrome, flip, images, cards, text } = GALLERY;
    const at = (offset: number) => `>${offset}`;
    const outgoing = to === 'list' ? q('[data-title]') : q('[data-title], [data-meta], [data-count]');
    const incoming = to === 'list' ? q('[data-title], [data-meta], [data-count]') : q('[data-title]');

    const t = gsap.timeline({ onComplete: () => void (tl.current = null) }).timeScale(speed);
    // 1. Text out, last row first on the way back.
    t.to(outgoing, {
      autoAlpha: 0,
      y: -text.rise / 2,
      duration: text.duration * 0.6,
      stagger: { each: text.stagger / 2, from: to === 'list' ? 'start' : 'end' },
      ease: 'power2.in',
    });
    if (to === 'grid') t.to(q('[data-line]'), { scaleX: 0, duration: cards.duration * 0.6, stagger: { each: cards.stagger / 2, from: 'end' }, ease: 'power2.in' }, '<');
    // 2. Header: the switch's pill slides over and the heading rolls to the other word.
    t.to(q('[data-pill]'), { ...pill, duration: chrome.duration, ease: chrome.ease }, at(chrome.offset));
    t.to(q('[data-label]'), { ...label, duration: chrome.duration, ease: chrome.ease }, '<');
    // 3. Cards fly. On one frame the layout switches and every thumb gets its inverse transform,
    //    all of them at once: a staggered from-state would leave the later thumbs drawn at their
    //    new place for a frame or ten before they jump back and fly.
    t.call(swap, undefined, at(flip.offset));
    t.set(thumbs, { x: (i) => inverse[i]!.x, y: (i) => inverse[i]!.y, scaleX: (i) => inverse[i]!.scaleX, scaleY: (i) => inverse[i]!.scaleY, borderRadius: (i) => inverse[i]!.borderRadius }, '<');
    t.set(incoming, { autoAlpha: 0 }, '<');
    if (to === 'list') t.set(q('[data-line]'), { scaleX: 0 }, '<');
    t.to(thumbs, { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: RADIUS, duration: flip.duration, ease: flip.ease, stagger: flip.stagger }, '<');
    // 4. Image crops settle inside their frames.
    t.fromTo(
      q('[data-img]'),
      { scale: images.zoom },
      { scale: 1, duration: images.duration, ease: images.ease, stagger: images.stagger, immediateRender: false },
      at(images.offset),
    );
    // 5. Rows draw their lines and count their views.
    if (to === 'list') {
      t.to(q('[data-line]'), { scaleX: 1, duration: cards.duration, ease: cards.ease, stagger: cards.stagger }, at(cards.offset));
      q('[data-count]').forEach((n, i) => {
        const v = { n: 0 };
        const show = () => void (n.textContent = Math.round(v.n).toLocaleString('en'));
        t.to(v, { n: PROJECTS[i]!.views, duration: cards.duration, ease: cards.ease, onStart: show, onUpdate: show }, `<${i ? cards.stagger : 0}`);
      });
    }
    // 6. Text in.
    t.fromTo(
      incoming,
      { autoAlpha: 0, y: text.rise },
      { autoAlpha: 1, y: 0, duration: text.duration, ease: text.ease, stagger: text.stagger, immediateRender: false },
      at(text.offset),
    );
    tl.current = t;
  };

  // The rig's Replay button toggles whichever gallery is mounted. A ref keeps the registered
  // callback stable, so it is registered once, not on every render.
  const toggle = useRef(play);
  toggle.current = play;
  useEffect(() => onToggle(() => toggle.current(root.current?.dataset.view === 'list' ? 'grid' : 'list')), []);

  // Off screen, a half-played switch jumps to its end instead of running unseen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => !e?.isIntersecting && tl.current?.progress(1));
    if (root.current) io.observe(root.current);
    return () => {
      io.disconnect();
      tl.current?.kill();
    };
  }, []);

  return (
    <div ref={root} className={s.gallery} data-view="grid" data-rig="gallery">
      <header className={s.head}>
        <p className={s.heading}>
          Work
          <span className={s.label} aria-hidden="true">
            <span className={s.labelTrack} data-label>
              <span>grid</span>
              <span>list</span>
            </span>
          </span>
        </p>
        <div className={s.switch} role="group" aria-label="View">
          <span className={s.pill} data-pill aria-hidden="true" />
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => play(v)}>
              {v === 'grid' ? 'Grid' : 'List'}
            </button>
          ))}
        </div>
      </header>
      <ul className={s.items}>
        {PROJECTS.map((p) => (
          <li key={p.title} className={s.item}>
            <span className={s.thumb} data-thumb>
              <span className={s.img} data-img style={{ '--h': p.hue } as CSSProperties} />
            </span>
            <span className={s.title} data-title>
              {p.title}
            </span>
            <span className={s.meta} data-meta>
              {p.meta}
            </span>
            <span className={s.count} data-count>
              {p.views.toLocaleString('en')}
            </span>
            <span className={s.line} data-line />
          </li>
        ))}
      </ul>
    </div>
  );
}
