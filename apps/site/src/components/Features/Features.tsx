import Link from 'next/link';
import type { ReactNode } from 'react';
import sec from '@/components/Section/Section.module.css';
import { EASES } from '@/motion/eases';
import { sizes } from '@/sizes';
import s from './Features.module.css';

function Curve({ bezier }: { bezier: readonly number[] }) {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = bezier;
  // A 0..1 box with headroom for overshooting curves.
  const p = (x: number, y: number) => `${4 + x * 40},${38 - y * 26}`;
  return (
    <svg className={s.curve} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="4" y="12" width="40" height="26" className={s.curveBox} />
      <path d={`M${p(0, 0)} C${p(x1, y1)} ${p(x2, y2)} ${p(1, 1)}`} className={s.curvePath} />
    </svg>
  );
}

type Feature = { key: string; title: string; body: ReactNode; aside?: ReactNode; docs: string };

const FEATURES: Feature[] = [
  {
    key: 'cost',
    title: 'Zero cost for visitors',
    docs: 'internals',
    body: (
      <>
        <p>
          With the gate closed there is no DOM work, no storage beyond one gate check, and the panel is never
          downloaded: it is a separate chunk that loads only behind the gate. On the server <code>rig()</code> is an
          identity function.
        </p>
        <p className={s.fine}>
          Gzipped, measured with size-limit on every build of this page. This page opens the gate for everyone with{' '}
          <code>enabled: true</code>; on your site it waits behind <code>?rig</code>.
        </p>
      </>
    ),
    aside: (
      <ul className={s.sizes} aria-label="Bundle sizes, gzipped">
        {sizes.map((m) => (
          <li key={m.name}>
            <span className={s.sizeValue}>{m.label}</span>
            <span className={s.sizeName}>{m.name}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: 'baseline',
    title: 'Code wins',
    docs: 'persistence',
    body: (
      <p>
        Every tweak is stored with the code default it was tuned against. Paste new values into the code and the stale
        tweaks quietly drop, so the panel never fights a developer. The CLI skips a value that changed in code since it
        was tuned, unless you pass <code>--force</code>.
      </p>
    ),
  },
  {
    key: 'useRig',
    title: 'Next.js and React, or anything else',
    docs: 'setup',
    body: (
      <p>
        <code>useRig()</code> gives you values to render, hydration-safe, and a dependency that changes when a
        designer tunes. <code>&lt;RigPanel /&gt;</code> goes in the root layout. The panel itself is a web component
        with its own shadow DOM; <code>mountPanel()</code> brings it to any stack.
      </p>
    ),
  },
  {
    key: 'eases',
    title: 'Your ease palette, and a bezier editor',
    docs: 'eases',
    body: (
      <p>
        Name the project’s curves once in <code>configure(&#123; eases &#125;)</code>. Designers pick them by name or
        drag a custom curve; custom curves come back as plain strings GSAP reads once <code>CustomEase</code> is
        registered. Snippets print your constant, not the numbers. This page’s palette:
      </p>
    ),
    aside: (
      <ul className={s.eases} aria-label="This site's ease palette">
        {Object.entries(EASES).map(([name, def]) => (
          <li key={name}>
            <Curve bezier={def.bezier} />
            <span>
              {def.label}
              <code>{def.code}</code>
            </span>
          </li>
        ))}
      </ul>
    ),
  },
];

// The smaller things, a few words each: one row on a laptop, the details in the docs.
const EXTRAS: [label: string, docs: string][] = [
  ['Dark, light or auto theme', 'theme'],
  ['Translatable UI', 'configure'],
  ['Copy code names its rig', 'share'],
  ['Bottom sheet on phones', 'anatomy'],
  ['Copy without HTTPS', 'share'],
  ['Custom hotkey', 'configure'],
];

export function Features() {
  return (
    <section className={sec.section} id="features" aria-labelledby="features-title">
      <header className={sec.head}>
        <h2 id="features-title" className={`${sec.title} ${sec.widest}`} data-rig="type">
          What ships in v0.1
        </h2>
        <p className={sec.lead}>
          A core that does nothing until the panel is switched on, a panel that never overrules the code, and the
          details a design review on the real site needs.
        </p>
      </header>
      <dl className={s.box}>
        {FEATURES.map((f) => (
          <div key={f.key} className={f.aside ? `${s.row} ${s.wide}` : s.row}>
            <dt>
              <span className={s.key}>{f.key}</span>
              <span className={s.title}>{f.title}</span>
            </dt>
            <dd>
              <div className={s.body}>
                {f.body}
                <Link className={s.docs} href={`/docs#${f.docs}`}>
                  Docs →
                </Link>
              </div>
              {f.aside}
            </dd>
          </div>
        ))}
      </dl>
      <div className={s.extras}>
        <p className={s.extrasTitle}>Also in v0.1</p>
        <ul>
          {EXTRAS.map(([label, docs]) => (
            <li key={label}>
              <Link href={`/docs#${docs}`}>{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
