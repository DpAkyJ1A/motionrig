import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/Code/CodeBlock';
import { InstallBlock } from '@/components/Code/InstallBlock';
import type { IconKind } from '@/components/Code/FileIcon';
import type { Lang } from '@/components/Code/highlight';
import sec from '@/components/Section/Section.module.css';
import s from './Quickstart.module.css';

type Step = { title: string; text: ReactNode; code?: string; label: string; copyName?: string; lang?: Lang; icon?: IconKind };

const STEPS: Step[] = [
  {
    title: 'Install',
    text: 'One package, no runtime dependencies. v0.1 is on its way to npm.',
    label: 'terminal',
  },
  {
    title: 'Configure once',
    text: (
      <>
        In a module your rigs import. Name your eases here; GSAP needs <code>CustomEase</code> registered to read
        them, and to read the custom curves designers make.
      </>
    ),
    label: 'motion.ts',
    code: `import { configure } from 'motionrig';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

export const EASE_SETTLE = 'settle';

configure({
  locale: 'en',
  eases: {
    settle: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_SETTLE', label: 'Settle' },
  },
});

gsap.registerPlugin(CustomEase);
CustomEase.create(EASE_SETTLE, '0.16,1,0.3,1');`,
  },
  {
    title: 'Rig a constant',
    text: (
      <>
        Wrap it where it is defined and read it when the animation plays. <code>applies: &apos;replay&apos;</code>{' '}
        tells the designer an edit shows on the next play, and <code>replay</code> gives them the button. In React,{' '}
        <code>useRig()</code> gives you values to render.
      </>
    ),
    label: 'reveal.ts',
    code: `import gsap from 'gsap';
import { rig } from 'motionrig';
import { EASE_SETTLE } from './motion';

export const REVEAL = rig('reveal', {
  duration: 0.9,
  stagger: 0.06,
  ease: EASE_SETTLE,
}, {
  title: 'Section reveal',
  note: 'Headings fade up when the page loads. Press Replay to see an edit.',
  applies: 'replay',
  replay: () => reveal(),
  controls: {
    duration: { unit: 's', max: 3 },
    stagger: { unit: 's', max: 0.3 },
  },
});

// Reads REVEAL each time it plays, so a replay shows the latest values.
export function reveal(): void {
  gsap.fromTo('.reveal', { y: 40, opacity: 0 }, { y: 0, opacity: 1, ...REVEAL });
}

reveal();`,
  },
  {
    title: 'Mount the panel',
    text: (
      <>
        In the root layout. It renders nothing and loads the panel only behind the gate. Not on React?{' '}
        <code>mountPanel()</code> from <code>motionrig</code> does the same.
      </>
    ),
    label: 'app/layout.tsx',
    code: `import { RigPanel } from 'motionrig/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <RigPanel />
      </body>
    </html>
  );
}`,
  },
  {
    title: 'Open your site with ?rig',
    text: (
      <>
        The panel appears and stays on for that tab. Designers tune, then press Copy code or Share link.{' '}
        <code>?rig=off</code> hides it again.
      </>
    ),
    label: 'browser',
    copyName: 'Copy the ?rig address',
    lang: 'sh',
    icon: 'url',
    code: 'https://your-site.com/?rig',
  },
  {
    title: 'Apply the link',
    text: 'Paste the share link into the CLI. Check with a dry run, then write.',
    label: 'terminal',
    copyName: 'Copy the apply commands',
    lang: 'sh',
    code: `npx motionrig apply "https://your-site.com/?rig=eyJ2Ijox…" --dry-run
npx motionrig apply "https://your-site.com/?rig=eyJ2Ijox…"`,
  },
];

export function Quickstart() {
  return (
    <section className={sec.section} id="quickstart" aria-labelledby="quickstart-title">
      <header className={sec.head}>
        <h2 id="quickstart-title" className={`${sec.title} ${sec.widest}`} data-rig="type">
          Quickstart
        </h2>
        <p className={sec.lead}>From install to a designer’s first tweak, in six steps.</p>
      </header>
      <ol className={s.steps}>
        {STEPS.map((step, i) => (
          <li key={step.title} className={s.step}>
            <div className={s.text}>
              <span className={s.num}>{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
            {step.code === undefined ? (
              <InstallBlock />
            ) : (
              <CodeBlock code={step.code} label={step.label} copyName={step.copyName} lang={step.lang} icon={step.icon} copy />
            )}
          </li>
        ))}
      </ol>
      <p className={sec.next}>
        <Link href="/docs#setup">
          Full setup for Next.js, React and vanilla JS, and every option, in the docs{' '}
          <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
