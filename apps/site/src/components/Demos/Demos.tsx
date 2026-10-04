import Link from 'next/link';
import type { ReactNode } from 'react';
import { highlight, type Lang } from '@/components/Code/highlight';
import { PanelButton } from '@/components/PanelButton/PanelButton';
import { Ring } from '@/components/Ring/Ring';
import sec from '@/components/Section/Section.module.css';
import s from './Demos.module.css';
import { FieldDemo } from './FieldDemo';
import { HoverDemo } from './HoverDemo';
import { ScrubDemo } from './ScrubDemo';
import { TimelineDemo } from './TimelineDemo';

type Pane = { id: string; engine: string; title: string; text: string; code: string; lang?: Lang; demo: ReactNode };

const PANES: Pane[] = [
  {
    id: 'timeline',
    engine: 'gsap.timeline()',
    title: 'A GSAP timeline',
    text: 'Three steps with overlaps, rebuilt from the rig whenever it changes. The bar count is rendered by React from useRig().',
    code: 'tl.to(bars, { stagger: TIMELINE.rise.stagger, ease: TIMELINE.rise.ease })',
    demo: <TimelineDemo />,
  },
  {
    id: 'scrub',
    engine: 'ScrollTrigger',
    title: 'A scroll scrub',
    text: 'Smoothing, start and end are numbers in a rig, so the scroll ride itself can be tuned while you scroll.',
    code: 'scrollTrigger: { scrub: SCRUB.smooth, start: `top ${SCRUB.start}%` }',
    demo: <ScrubDemo />,
  },
  {
    id: 'hover',
    engine: 'CSS variables',
    title: 'A CSS hover',
    text: 'With css: true there is no animation code at all. The panel writes custom properties; the stylesheet does the rest.',
    code: 'translate: 0 calc(-1 * var(--hover-lift, 14px));',
    lang: 'css',
    demo: <HoverDemo />,
  },
  {
    id: 'field',
    engine: 'canvas 2D',
    title: 'A canvas render loop',
    text: 'The loop reads FIELD every frame. No state, no re-render: the next frame simply draws with the new numbers.',
    code: 'ctx.lineWidth = FIELD.width; // read every frame',
    demo: <FieldDemo />,
  },
];

export function Demos() {
  return (
    <section className={sec.section} id="demos" aria-labelledby="demos-title">
      <header className={sec.head}>
        <h2 id="demos-title" className={`${sec.title} ${sec.condensed}`} data-rig="type">
          If it reads a number, it can be rigged
        </h2>
        <p className={sec.lead}>
          Four engines, four rigs, one panel. Each pane runs on a plain object wrapped in <code>rig()</code>. Press{' '}
          <b>Tune</b> to open its tab and change it while it plays.
        </p>
      </header>
      <div className={s.quad}>
        {PANES.map((p) => (
          <article key={p.id} className={s.pane} aria-labelledby={`pane-${p.id}`}>
            <div className={s.viewport}>
              <span className={s.engine}>{p.engine}</span>
              {p.demo}
            </div>
            <div className={s.caption}>
              <div className={s.captionHead}>
                <h3 id={`pane-${p.id}`}>
                  {p.title} <span className={s.rigId}>rig(&apos;{p.id}&apos;)</span>
                </h3>
                <PanelButton id={p.id} className={s.tune} label={`Tune: ${p.title}`}>
                  <Ring size={14} strokeWidth={2.2} />
                  Tune
                </PanelButton>
              </div>
              <p>{p.text}</p>
              <code className={s.line}>{highlight(p.code, p.lang ?? 'ts')}</code>
            </div>
          </article>
        ))}
      </div>
      <p className={sec.next}>
        <Link href="/examples">
          Ten recipes, one per engine, with the diff from your code to rigged <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
