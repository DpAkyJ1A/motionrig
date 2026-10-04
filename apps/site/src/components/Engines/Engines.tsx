import Link from 'next/link';
import { highlight, type Lang } from '@/components/Code/highlight';
import sec from '@/components/Section/Section.module.css';
import { EXAMPLES } from '@/examples/registry';
import s from './Engines.module.css';

/** Each engine with where the rig value goes in, condensed from its /examples recipe. */
const ENGINES: { name: string; slug: string; lang: Lang; line: string; via?: string }[] = [
  { name: 'CSS transitions', slug: 'css-transition', lang: 'css', line: 'scale: var(--card-scale, 1.02);' },
  { name: 'CSS @keyframes', slug: 'keyframes', lang: 'css', line: 'animation: pulse var(--pulse-duration, 2.4s) infinite;' },
  { name: 'GSAP', slug: 'gsap-from', lang: 'ts', line: 'gsap.from(items, { y: FEED.y, ease: FEED.ease });' },
  { name: 'ScrollTrigger', slug: 'scroll-scrub', lang: 'ts', line: 'scrollTrigger: { scrub: PARALLAX.scrub }' },
  { name: 'Motion', slug: 'motion-spring', lang: 'tsx', line: "transition={{ type: 'spring', bounce }}" },
  { name: 'Web Animations', slug: 'waapi', lang: 'ts', line: 'dot.animate(keys, { duration: DOTS.duration });' },
  { name: 'Canvas 2D', slug: 'canvas', lang: 'ts', line: 'ctx.lineTo(x, Math.sin(a) * WAVE.amplitude);' },
  // No WebGL recipe of its own: a uniform is the canvas loop's read with a different sink.
  { name: 'WebGL / three', slug: 'canvas', lang: 'ts', line: 'uniforms.uAmp.value = WAVE.amplitude;', via: 'same loop as' },
  { name: 'React state', slug: 'react-state', lang: 'tsx', line: 'const { duration, ease } = useRig(ACCORDION);' },
];

const TITLE = Object.fromEntries(EXAMPLES.map((e) => [e.slug, e.title]));

export function Engines() {
  return (
    <section className={sec.section} id="engines" aria-labelledby="engines-title">
      <header className={sec.head}>
        <h2 id="engines-title" className={`${sec.title} ${sec.wide}`} data-rig="type">
          Works with whatever moves your pixels.
        </h2>
        <p className={sec.lead}>
          motionrig tunes motion you already shipped in code: the numbers, eases and colours your animation reads. It
          isn’t a timeline editor, so nothing is keyframed or exported; whatever engine runs the motion keeps running
          it.
        </p>
      </header>
      <ul className={s.grid}>
        {ENGINES.map((e) => (
          <li key={e.name}>
            <Link className={s.tile} href={`/examples#${e.slug}`}>
              <span className={s.name}>{e.name}</span>
              <code className={s.line}>{highlight(e.line, e.lang)}</code>
              <span className={s.recipe}>
                {e.via ?? 'Recipe:'} {TITLE[e.slug]}
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
