import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/Code/CodeBlock';
import { InstallBlock } from '@/components/Code/InstallBlock';
import { Mechanics } from '@/components/Docs/Mechanics';
import { Props } from '@/components/Docs/Props';
import { type Setup, SetupTabs } from '@/components/Docs/SetupTabs';
import { ThemeDemo } from '@/components/Docs/ThemeDemo';
import d from '@/components/Docs/Docs.module.css';
import { Footer } from '@/components/Footer/Footer';
import { Nav } from '@/components/Nav/Nav';
import p from '@/components/Page/Page.module.css';
import { Ring } from '@/components/Ring/Ring';
import sec from '@/components/Section/Section.module.css';
import { type NavItem, SideNav } from '@/components/SideNav/SideNav';
import { pageMeta } from '@/meta';
import { sizeOf as size } from '@/sizes';
import type { MessageKey } from 'motionrig';
import PKG from 'motionrig/package.json';

export const metadata: Metadata = pageMeta(
  '/docs',
  'Docs — motionrig',
  'The motionrig API: rig() and its meta, every control option, configure() and its panel theme, useRig and RigPanel, the ?rig gate, share links and the motionrig apply CLI.',
);

// Version floors straight from the package: `engines` for the CLI, the React peer range.
const floor = (range: string) => range.replace('>=', '≥ ');
const NODE = `Node ${floor(PKG.engines.node)}`;

const TOC: NavItem[] = [
  {
    id: 'start',
    label: 'Getting started',
    children: [
      { id: 'install', label: 'Install' },
      { id: 'setup', label: 'Setup' },
      { id: 'loop', label: 'The loop' },
    ],
  },
  {
    id: 'rig',
    label: 'rig()',
    children: [
      { id: 'meta', label: 'Meta' },
      { id: 'applies', label: 'When an edit shows' },
      { id: 'locate', label: 'Locate' },
      { id: 'controls', label: 'Controls' },
      { id: 'inference', label: 'Inference & order' },
      { id: 'eases', label: 'Eases' },
      { id: 'css', label: 'CSS binding' },
    ],
  },
  {
    id: 'configure',
    label: 'configure()',
    children: [{ id: 'theme', label: 'Panel theme' }],
  },
  {
    id: 'panel',
    label: 'The panel',
    children: [
      { id: 'anatomy', label: 'Anatomy' },
      { id: 'tabs', label: 'Tabs: new, +N more' },
    ],
  },
  {
    id: 'react',
    label: 'React',
    children: [
      { id: 'use-rig', label: 'useRig' },
      { id: 'rig-panel', label: '<RigPanel>' },
    ],
  },
  {
    id: 'shipping',
    label: 'Gate & sharing',
    children: [
      { id: 'gate', label: 'The ?rig gate' },
      { id: 'persistence', label: 'Persistence' },
      { id: 'share', label: 'Copy code & share links' },
      { id: 'cli', label: 'CLI: motionrig apply' },
    ],
  },
  {
    id: 'runtime',
    label: 'Low-level API',
    children: [
      { id: 'panel-api', label: 'mountPanel, openPanel' },
      { id: 'store', label: 'subscribe, snapshot' },
    ],
  },
  { id: 'faq', label: 'Troubleshooting' },
  { id: 'internals', label: 'Under the hood' },
  { id: 'types', label: 'Types' },
];

function Section({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <section className={d.section} id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={d.h2}>
        {title}
      </h2>
      {lead && <p className={d.lead}>{lead}</p>}
      {children}
    </section>
  );
}

function Sub({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className={d.sub} id={id} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={d.h3}>
        <a href={`#${id}`} className={d.anchor}>
          {title}
        </a>
      </h3>
      {children}
    </section>
  );
}

// The setup tabs. Each is complete on its own; vanilla and React show the same rig and config files.
const HERO_RIG = `import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', distance: 24 });`;

const VITE_CONFIG = `import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { configure } from 'motionrig';

// GSAP reads named and custom curves through CustomEase.
gsap.registerPlugin(CustomEase);
CustomEase.create('settle', '0.16,1,0.3,1');

configure({
  // Vite: on in dev; undefined (not false) keeps ?rig working in production.
  enabled: import.meta.env.DEV || undefined,
  eases: { settle: { bezier: [0.16, 1, 0.3, 1], label: 'Settle' } },
});`;

const VANILLA_MAIN = `import './config'; // first, so a share link's values land before anything plays
import gsap from 'gsap';
import { mountPanel } from 'motionrig';
import { HERO } from './hero';

// Downloads and mounts the panel only when the page is opened with ?rig.
mountPanel();

// Read at play time, so a replay picks up the designer's values.
gsap.from('.hero', { y: HERO.distance, duration: HERO.duration, ease: HERO.ease });`;

const REACT_HERO = `import gsap from 'gsap';
import { useRig } from 'motionrig/react';
import { useEffect, useRef } from 'react';
import { HERO } from './motion/hero';

export function Hero() {
  const ref = useRef<HTMLHeadingElement>(null);
  // A new snapshot on every edit: the effect re-runs and the entrance replays.
  const { duration, ease, distance } = useRig(HERO);

  useEffect(() => {
    const tween = gsap.from(ref.current, { y: distance, duration, ease });
    return () => void tween.revert();
  }, [duration, ease, distance]);

  return <h1 ref={ref} data-rig="hero">Ship it.</h1>;
}`;

const REACT_MAIN = `import './motion/config'; // configure() first, if you use it
import { RigPanel } from 'motionrig/react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    {/* Renders nothing; loads the panel only behind ?rig. */}
    <RigPanel />
  </>,
);`;

const NEXT_RIG = `// A constants module: no 'use client' needed.
import { rig } from 'motionrig';

export const HERO = rig('hero', { duration: 0.6, ease: 'power2.out', distance: 24 });`;

// The React component as a client component, importing through the @/ alias.
const NEXT_HERO = `'use client';
${REACT_HERO.replace("'./motion/hero'", "'@/motion/hero'")}`;

const NEXT_MOUNT = `'use client';
import { RigPanel } from 'motionrig/react';

export function PanelMount() {
  // Import every rig-bearing module, so every tab shows on every page.
  return <RigPanel preload={() => import('@/motion/hero')} />;
}`;

const NEXT_LAYOUT = `import { PanelMount } from '@/components/PanelMount';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PanelMount />
      </body>
    </html>
  );
}`;

const NEXT_CONFIG = `// Runs in the browser before the app hydrates.
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { configure } from 'motionrig';

// GSAP reads named and custom curves through CustomEase.
gsap.registerPlugin(CustomEase);
CustomEase.create('settle', '0.16,1,0.3,1');

configure({
  // On in development; undefined (not false) keeps ?rig working in production.
  enabled: process.env.NODE_ENV === 'development' || undefined,
  eases: { settle: { bezier: [0.16, 1, 0.3, 1], label: 'Settle' } },
});`;

// Marks from Simple Icons (CC0), 24×24.
const LOGO = {
  react:
    'M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z',
  javascript:
    'M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z',
  next: 'M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z',
};

// Every key of the panel's messages, for configure({ messages }). Checked against the package's
// MessageKey type, so a key the panel adds or drops fails the build instead of going stale here.
const MESSAGE_KEYS = Object.keys({
  open: 0, panel: 0, search: 0, share: 0, collapse: 0, tabs: 0, new: 0, changed: 0, noMatch: 0, empty: 0,
  emptyHint: 0, live: 0, replay: 0, reload: 0, replayBtn: 0, reloadBtn: 0, locate: 0, locateNone: 0, more: 0,
  less: 0, reset: 0, value: 0, pick: 0, custom: 0, palette: 0, builtins: 0, curves: 0, handle: 0, preview: 0,
  params: 0, copyCurve: 0, curveCopied: 0, copyCode: 0, resetTab: 0, resetAll: 0, confirm: 0, codeCopied: 0,
  linkCopied: 0, payloadCopied: 0, imported: 0, tweaks: 0, rigs: 0, moreTabs: 0, seenAll: 0, seenAllName: 0,
  nothingChanged: 0, tabReset: 0, allReset: 0, manual: 0, close: 0,
} satisfies Record<MessageKey, 0>);

const RIG_SIG = `function rig<T extends object>(id: string, values: T, meta?: RigMeta<T>): T;`;

const RIG_EXAMPLE = `export const HERO = rig('hero', {
  duration: 0.6,
  ease: 'power2.out',
  ring: { draw: 1.8, delay: 0.15 },  // a nested object becomes a group
});

gsap.from('.hero', { y: 24, duration: HERO.duration, ease: HERO.ease });`;

const META_EXAMPLE = `rig('hero', values, {
  title: 'Hero headline',
  note: 'The headline at the top. Press Replay to see an edit.',
  applies: 'replay',
  replay: () => playHero(),
  target: '[data-rig~="hero"]',
  onChange: () => tl.invalidate(),
  controls: {
    duration: { unit: 's', min: 0.1, max: 2, step: 0.05 },
    debug: false,
  },
});`;

const CONTROLS_EXAMPLE = `rig('card', {
  lift: 8,
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  mode: 'fade',
  enter: { rows: 12, gap: 0.04 },
}, {
  controls: {
    lift: { unit: 'px', min: -40, max: 40, step: 1, hint: 'How far it rises' },
    mode: { options: ['fade', 'slide', { label: 'scale up', value: 'scale' }] },
    enter: { label: 'Entrance', hint: 'The list under the card' },
    'enter.rows': { group: 'Layout', min: 1, max: 30, step: 1 },
    'enter.gap': { unit: 's' },
  },
});`;

const EASES_EXAMPLE = `import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import type { EaseDef } from 'motionrig';

// The names your animations use; \`code\` makes Copy code print the constant.
export const EASE_SETTLE = 'settle';
export const EASE_SNAP = 'snap';

export const EASES = {
  [EASE_SETTLE]: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_SETTLE', label: 'Settle' },
  [EASE_SNAP]: { bezier: [0.76, 0, 0.24, 1], code: 'EASE_SNAP', label: 'Snap' },
} satisfies Record<string, EaseDef>;

// motionrig never imports gsap: register the curves yourself, so GSAP
// knows the names and parses the "x1,y1,x2,y2" strings the panel writes.
gsap.registerPlugin(CustomEase);
for (const [name, def] of Object.entries(EASES)) {
  CustomEase.create(name, def.bezier.join(','));
}`;

const CSS_RIG = `rig('faq', { duration: 0.7, ease: 'ease-out', lift: 12 }, {
  css: { prefix: 'faq-' },               // or css: true, for no prefix
  controls: { duration: { unit: 's' }, lift: { unit: 'px' } },
});`;

const CSS_SHEET = `.faq {
  transition-duration: var(--faq-duration, 0.7s);
  transition-timing-function: var(--faq-ease, ease-out);
  translate: 0 calc(-1 * var(--faq-lift, 12px));
}`;

const CONFIGURE_EXAMPLE = `configure({
  // On in dev; undefined (not false) keeps ?rig working in production.
  enabled: process.env.NODE_ENV === 'development' || undefined,
  eases: EASES,
  order: ['hero', 'faq'],
  hotkey: 'alt+shift+m',
  theme: 'auto',
});`;

const USE_RIG = `'use client';
import gsap from 'gsap';
import { useRig } from 'motionrig/react';
import { useEffect } from 'react';
import { HERO } from '@/motion/hero';

export function Hero() {
  const { duration, ease } = useRig(HERO);
  // A new snapshot identity on every change: a fine effect dependency.
  useEffect(() => {
    const tween = gsap.from('.hero', { y: 24, duration, ease });
    return () => void tween.revert();
  }, [duration, ease]);
  return <h1 className="hero" data-rig="hero">Ship it.</h1>;
}`;

const RIG_PANEL = `<RigPanel preload={() => import('@/motion/rigs')} />`;

const PANEL_API = `import { isEnabled, mountPanel, openPanel } from 'motionrig';

mountPanel({ preload: () => import('./rigs') }); // what <RigPanel> does
openPanel();           // mounts if needed, opens on the last tab
openPanel('hero');     // opens straight on a rig's tab

if (isEnabled()) showTuneButtons();`;

const STORE_API = `import { defaultsOf, snapshot, subscribe } from 'motionrig';

const stop = subscribe(HERO, () => tl.invalidate().restart());
snapshot(HERO);    // immutable copy, same identity until the next change
defaultsOf(HERO);  // the code defaults, whatever is tuned
stop();`;

const COPY_OUTPUT = `// hero — Hero headline
{
  duration: 0.75,
  ease: EASE_SETTLE,
  ring: {
    draw: 1.8,
    delay: 0.15,
  },
}`;

const CLI_USAGE = `motionrig apply <link | payload | file> [--root <dir>] [--dry-run] [--force]
motionrig --help | --version`;

const CLI_EXAMPLE = `# paste the share link straight from the panel; look first
npx motionrig apply "https://staging.example.com/?rig=eyJ2IjoxLC…" --dry-run

# then write, scanning one package of a monorepo
npx motionrig apply "https://staging.example.com/?rig=eyJ2IjoxLC…" --root ./apps/site`;

const TYPES = `type Leaf = number | string | boolean;
interface RigValues { [key: string]: Leaf | RigValues }
type Bezier = [number, number, number, number];
type Applies = 'live' | 'replay' | 'reload';
type ControlType = 'number' | 'toggle' | 'select' | 'ease' | 'color' | 'text';
type Option = string | number | { label: string; value: string | number };
type Flavour = 'gsap' | 'css';
type MessageKey = 'copyCode' | 'share' | 'search' | …; // all of them under messages

interface ControlMeta {
  type?: ControlType;
  label?: string;
  hint?: string;
  group?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Option[];
  flavour?: Flavour;
}

interface RigMeta<T> {
  title?: string;
  note?: string;
  applies?: Applies;
  replay?: () => void;
  onChange?: (values: T) => void;
  css?: boolean | { prefix?: string };
  target?: string;
  controls?: Record<string, ControlMeta | false>;
}

interface EaseDef { bezier: Bezier; code?: string; label?: string }

interface RigConfig {
  param?: string;
  enabled?: boolean;
  storageKey?: string;
  locale?: 'en' | 'ru';
  messages?: Partial<Record<MessageKey, string>>;
  eases?: Record<string, Bezier | EaseDef>;
  hotkey?: string | false;
  order?: string[];
  theme?: 'dark' | 'light' | 'auto';
}`;

const DONE = (
  <p>
    Open the page with <code>?rig</code> and the panel has a <b>hero</b> tab. <a href="#loop">The loop</a> takes it
    from there.
  </p>
);

const WRAP = (
  <>
    <b>Wrap the constants.</b> <code>rig()</code> registers the object and returns it, so the rest of the code reads
    it like any other constant.
  </>
);

const CONFIGURE_WHY = (
  <>
    <b>Configure, if you need to.</b> <code>?rig</code> works without it. <code>configure()</code> names your curves,
    turns the panel on in development and sets <a href="#configure">the rest</a>.
  </>
);

const VITE_FLAG = (
  <>
    The flag below is Vite&apos;s; on webpack, use <code>process.env.NODE_ENV === &apos;development&apos;</code>.
  </>
);

// Next.js first, the tab a page view starts on; then React, then every other stack.
const SETUPS: Setup[] = [
  {
    id: 'next',
    label: 'Next.js',
    logo: LOGO.next,
    panel: (
      <>
        <p>The App Router. Five files; the last one is optional and needs Next.js 15.3 or later.</p>
        <p>
          {WRAP} The module needs no directive: it registers when it runs in the browser, and on the server{' '}
          <code>rig()</code> just returns the values, so Server Components can read the defaults too.
        </p>
        <CodeBlock code={NEXT_RIG} label="motion/hero.ts" copy />
        <p>
          <b>Read them in a client component.</b> Values you render or use in an effect go through{' '}
          <a href="#use-rig">useRig</a>, a hook, so the component that calls it is marked{' '}
          <code>&apos;use client&apos;</code>. Each edit is a new snapshot: the component re-renders and the effect
          re-runs.
        </p>
        <CodeBlock code={NEXT_HERO} label="components/Hero.tsx" copy />
        <p>
          <b>Mount the panel</b> once, near the root. <a href="#rig-panel">&lt;RigPanel&gt;</a> takes a function
          prop, <code>preload</code>, which a Server Component layout can&apos;t pass, so it goes in a small client
          component. <code>preload</code> imports every rig-bearing module, so every tab shows on every page, not only
          the rigs of the page you are on.
        </p>
        <CodeBlock code={NEXT_MOUNT} label="components/PanelMount.tsx" copy />
        <p>
          Then render it once in the root layout, after the page. It renders nothing, and the panel downloads only
          when the page is opened with <code>?rig</code>.
        </p>
        <CodeBlock code={NEXT_LAYOUT} label="app/layout.tsx" copy />
        <p>
          {CONFIGURE_WHY} In Next.js it goes in <code>instrumentation-client.ts</code>, next to the{' '}
          <code>app</code> folder: it runs before the app hydrates, so a share link&apos;s values land before any
          layout effect reads them.
        </p>
        <CodeBlock code={NEXT_CONFIG} label="instrumentation-client.ts" copy />
        {DONE}
      </>
    ),
  },
  {
    id: 'react',
    label: 'React',
    logo: LOGO.react,
    panel: (
      <>
        <p>
          Any React {floor(PKG.peerDependencies.react)} app: Vite, Remix, React Router, or a widget on a plain page.
          Four files, the third one optional.
        </p>
        <p>{WRAP}</p>
        <CodeBlock code={HERO_RIG} label="motion/hero.ts" copy />
        <p>
          <b>Read them in a component.</b> Values you render or use in an effect go through{' '}
          <a href="#use-rig">useRig</a>: each edit is a new snapshot, so the component re-renders and the effect
          re-runs. Values read inside a running animation can stay plain reads, like <code>HERO.duration</code>.
        </p>
        <CodeBlock code={REACT_HERO} label="Hero.tsx" copy />
        <p>
          {CONFIGURE_WHY} It goes in a module of its own, imported before anything else. {VITE_FLAG}
        </p>
        <CodeBlock code={VITE_CONFIG} label="motion/config.ts" copy />
        <p>
          <b>Mount the panel</b> once, next to the app, after the config import.{' '}
          <a href="#rig-panel">&lt;RigPanel&gt;</a> renders nothing, and the panel downloads only when the page is
          opened with <code>?rig</code>.
        </p>
        <CodeBlock code={REACT_MAIN} label="main.tsx" copy />
        {DONE}
      </>
    ),
  },
  {
    id: 'vanilla',
    label: 'Vanilla JS',
    logo: LOGO.javascript,
    panel: (
      <>
        <p>No framework: TypeScript or JavaScript with a bundler, Vite here. Three files, the second one optional.</p>
        <p>{WRAP}</p>
        <CodeBlock code={HERO_RIG} label="hero.ts" copy />
        <p>
          {CONFIGURE_WHY} It goes in a module of its own, imported before anything else. {VITE_FLAG}
        </p>
        <CodeBlock code={VITE_CONFIG} label="config.ts" copy />
        <p>
          <b>Mount the panel and play.</b> Call <a href="#panel-api">mountPanel()</a> once, after the config import:
          it costs nothing until the page is opened with <code>?rig</code>. Read the values when the animation plays,
          not into variables at load, so the next play picks up an edit (<a href="#applies">when an edit shows</a>).
        </p>
        <CodeBlock code={VANILLA_MAIN} label="main.ts" copy />
        {DONE}
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <>
      <Nav page="docs" />
      <main id="main">
        <header className={p.intro}>
          <p className={p.kicker}>
            <Ring size={16} strokeWidth={2.4} /> Docs · v0.1
          </p>
          <h1 className={`${sec.title} ${sec.widest} ${p.introTitle}`} data-rig="type">
            API reference
          </h1>
          <p className={sec.lead}>
            Everything motionrig exports, every option, and what it defaults to. One function to wrap your
            constants, one to configure the panel, two React bindings, and a CLI that writes the result back to
            code. Looking for working code? See the <Link href="/examples">examples</Link>.
          </p>
        </header>

        <div className={p.layout}>
          <SideNav items={TOC} title="On this page" mobile="disclosure" />
          <div className={`${p.content} ${d.doc}`}>
            <Section id="start" title="Getting started">
              <Sub id="install" title="Install">
                <InstallBlock />
                <Props
                  label="Entry points"
                  rows={[
                    {
                      name: 'motionrig',
                      type: size('core — every'),
                      children: (
                        <p>
                          <code>rig</code>, <code>configure</code>, <code>openPanel</code> and the rest. Zero
                          dependencies. Gzipped, everything; <code>rig</code> + <code>configure</code> alone is{' '}
                          {size('core — rig')}.
                        </p>
                      ),
                    },
                    {
                      name: 'motionrig/react',
                      type: size('react'),
                      children: (
                        <p>
                          <code>useRig</code> and <code>&lt;RigPanel&gt;</code>. React {floor(PKG.peerDependencies.react)} is an optional peer
                          dependency, needed only when you import this entry.
                        </p>
                      ),
                    },
                    {
                      name: '<motionrig-panel>',
                      type: size('panel'),
                      children: (
                        <p>
                          The panel: a web component with its own shadow root, loaded with a dynamic{' '}
                          <code>import()</code> only behind an open gate. Visitors never download it.
                        </p>
                      ),
                    },
                    {
                      name: 'npx motionrig',
                      type: NODE,
                      children: (
                        <p>
                          The CLI that applies a share link to your source. See <a href="#cli">motionrig apply</a>.
                        </p>
                      ),
                    },
                  ]}
                />
              </Sub>
              <Sub id="setup" title="Setup">
                <p>Pick your stack. Each tab is the whole setup, from the first rig to an open panel.</p>
                <SetupTabs setups={SETUPS} />
              </Sub>
              <Sub id="loop" title="The loop">
                <p>Once a rig is on the page, this is the whole workflow:</p>
                <ol className={d.steps}>
                  <li>
                    Open any page of the site with <code>?rig</code>. The panel stays on for the rest of the tab (
                    <a href="#gate">the gate</a>).
                  </li>
                  <li>
                    Tune. Each rig is a tab; its badge says whether an edit shows live, on the next play or after a
                    reload (<a href="#applies">when an edit shows</a>), and Locate points at what it drives (
                    <a href="#locate">Locate</a>).
                  </li>
                  <li>
                    Hand it back: <b>Copy code</b> for one rig, <b>Share link</b> for every tweak at once (
                    <a href="#share">Copy code &amp; share links</a>).
                  </li>
                  <li>
                    Apply it: <code>npx motionrig apply &quot;&lt;link&gt;&quot;</code> patches the source (
                    <a href="#cli">CLI</a>). A tweak whose code default changed since it was tuned is skipped, not
                    forced (<a href="#persistence">code wins</a>).
                  </li>
                </ol>
              </Sub>
            </Section>

            <Section
              id="rig"
              title="rig(id, values, meta?)"
              lead={
                <>
                  Registers a plain object and returns <em>the same object</em>. It is mutated in place, nested objects
                  too, so code that reads it at play time always sees the tuned value.
                </>
              }
            >
              <CodeBlock code={RIG_SIG} label="signature" />
              <Props
                label="rig() parameters"
                rows={[
                  {
                    name: 'id',
                    type: 'string',
                    children: (
                      <p>
                        How the panel, share links and <code>motionrig apply</code> find this rig. Keep it stable and
                        unique across the site.
                      </p>
                    ),
                  },
                  {
                    name: 'values',
                    type: 'T extends object',
                    children: (
                      <p>
                        Leaves are numbers, strings and booleans; nested plain objects become groups. Arrays,
                        functions, <code>null</code> and class instances pass through untouched and never show in the
                        panel.
                      </p>
                    ),
                  },
                  {
                    name: 'meta',
                    type: 'RigMeta<T>',
                    def: '{}',
                    children: (
                      <p>
                        How the rig looks and behaves in the panel. See <a href="#meta">Meta</a>.
                      </p>
                    ),
                  },
                ]}
              />
              <CodeBlock code={RIG_EXAMPLE} label="hero.ts" copy />
              <ul className={d.notes}>
                <li>
                  On the server (no <code>window</code>) it is an identity function: nothing is registered, cloned or
                  read.
                </li>
                <li>
                  With the <a href="#gate">gate</a> closed it only registers: past the one-time gate check, no storage read, no clone, no DOM work.
                </li>
                <li>
                  Registering an id again replaces the entry and re-applies the stored tweaks to the new object, so a
                  module re-run by HMR keeps its tuning. Two different objects under one id is a bug: the second wins.
                </li>
              </ul>

              <Sub id="meta" title="Meta">
                <Props
                  label="RigMeta fields"
                  rows={[
                    {
                      name: 'title',
                      type: 'string',
                      def: 'the id',
                      children: <p>The tab title in the panel.</p>,
                    },
                    {
                      name: 'note',
                      type: 'string',
                      children: (
                        <p>
                          For the designer: where to look and how it behaves. Long notes clamp to three lines with a
                          More toggle.
                        </p>
                      ),
                    },
                    {
                      name: 'applies',
                      type: "'live' | 'replay' | 'reload'",
                      def: "'live'",
                      children: (
                        <p>
                          When an edit shows, as a badge on the tab: <b>live</b>, <b>on next play</b> or{' '}
                          <b>after reload</b>. With <code>&apos;reload&apos;</code> and no <code>replay</code>, the
                          panel offers a Reload button. See <a href="#applies">When an edit shows</a>.
                        </p>
                      ),
                    },
                    {
                      name: 'replay',
                      type: '() => void',
                      children: (
                        <p>
                          Shows a <b>▶ Replay</b> button that calls it. Rebuild or restart your animation here.
                        </p>
                      ),
                    },
                    {
                      name: 'onChange',
                      type: '(values: T) => void',
                      children: (
                        <p>
                          Runs after a change, batched once per microtask. The place to rebuild a timeline or a
                          ScrollTrigger so edits show live, as in the{' '}
                          <Link href="/examples#scroll-scrub">ScrollTrigger recipe</Link>.
                        </p>
                      ),
                    },
                    {
                      name: 'css',
                      type: 'boolean | { prefix?: string }',
                      def: 'false',
                      children: (
                        <p>
                          Mirrors every overridden leaf to a custom property on <code>:root</code>. See{' '}
                          <a href="#css">CSS binding</a>.
                        </p>
                      ),
                    },
                    {
                      name: 'target',
                      type: 'string (CSS selector)',
                      children: (
                        <p>
                          What the rig drives. <b>Locate</b> scrolls to it and rings it (see{' '}
                          <a href="#locate">Locate</a>); a floating panel
                          opening on this tab moves to the other side of the viewport so it never covers it (until the
                          designer drags the panel).
                        </p>
                      ),
                    },
                    {
                      name: 'controls',
                      type: 'Record<string, ControlMeta | false>',
                      children: (
                        <p>
                          Per-value control options, keyed by dotted path (<code>&apos;enter.rows&apos;</code>).{' '}
                          <code>false</code> hides a value. See <a href="#controls">Controls</a>.
                        </p>
                      ),
                    },
                  ]}
                />
                <CodeBlock code={META_EXAMPLE} label="hero.ts" copy />
              </Sub>

              <Sub id="applies" title="When an edit shows">
                <p>
                  Each tab carries a badge from <code>meta.applies</code>, so the designer knows whether to watch,
                  press Replay or reload. Pick it by when your code reads the value.
                </p>
                <dl className={d.applies}>
                  <div>
                    <dt>
                      <span className={d.badge}>live</span>
                    </dt>
                    <dd>
                      The edit shows at once. Pick it when the value is read every frame or every render: a css rig,
                      a canvas loop, a <code>useRig</code> value in <code>style</code>, a hover transition. The
                      default.
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <span className={d.badge} data-applies="replay">
                        on next play
                      </span>
                    </dt>
                    <dd>
                      The edit shows the next time the animation runs. Pick it for one-shot entrances and timelines
                      that read the rig when they start, and give <code>replay</code> so a <b>Replay</b> button can
                      run it again on demand.
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <span className={d.badge} data-applies="reload">
                        after reload
                      </span>
                    </dt>
                    <dd>
                      The edit needs a page load. Pick it for values read once at startup, like a preloader or a
                      smooth-scroll setup; without <code>replay</code> the panel offers a <b>Reload</b> button. If an{' '}
                      <code>onChange</code> can rebuild the thing instead, prefer that and keep it live.
                    </dd>
                  </div>
                </dl>
              </Sub>

              <Sub id="locate" title="Locate">
                <p>
                  The crosshair in a tab&apos;s header answers “which thing is this?”. It scrolls the first element
                  matching <code>meta.target</code> into view and rings up to 24 matches for 1.6 s. When nothing on the
                  current page matches, it says so in a toast instead of scrolling anywhere.
                </p>
                <ul className={d.notes}>
                  <li>
                    An animation that repeats on several pages, like a card hover or a line reveal, takes one selector
                    that matches it everywhere; Locate works on whichever page the designer is on.
                  </li>
                  <li>
                    Some motion has nothing to point at: a page transition is gone before anyone could look. Give it a{' '}
                    <code>replay</code> to run it on demand and leave <code>target</code> out; the tab then shows no
                    crosshair.
                  </li>
                </ul>
              </Sub>

              <Sub id="controls" title="Controls">
                <p>
                  Every leaf gets a control on its own. <code>controls</code> refines it, keyed by dotted path; an
                  object path (a group) takes <code>label</code> and <code>hint</code> for its heading.
                </p>
                <Props
                  label="ControlMeta options"
                  rows={[
                    {
                      name: 'type',
                      type: "'number' | 'toggle' | 'select' | 'ease' | 'color' | 'text'",
                      def: 'inferred',
                      children: (
                        <p>
                          Forces a control type. Rarely needed: see <a href="#inference">inference</a>.
                        </p>
                      ),
                    },
                    {
                      name: 'label',
                      type: 'string',
                      def: 'the key',
                      children: <p>The name shown in the panel. Without it, the key shows in mono.</p>,
                    },
                    {
                      name: 'hint',
                      type: 'string',
                      children: <p>One line under the control.</p>,
                    },
                    {
                      name: 'group',
                      type: 'string',
                      children: (
                        <p>
                          A heading to list the control under, inside its object. Joined with the object&apos;s own
                          label: <code>Entrance · Layout</code>.
                        </p>
                      ),
                    },
                    {
                      name: 'min, max',
                      type: 'number',
                      def: 'inferred',
                      children: (
                        <p>
                          The slider&apos;s range. The numeric field still accepts values outside it. Inferred from
                          the default (see <a href="#inference">inference</a>).
                        </p>
                      ),
                    },
                    {
                      name: 'step',
                      type: 'number',
                      def: 'inferred',
                      children: <p>Slider and arrow-key increment. Inferred to about 1/300 of the range.</p>,
                    },
                    {
                      name: 'unit',
                      type: 'string',
                      children: (
                        <p>
                          Shown after the value. In a <code>css</code> rig it is appended to the custom property:{' '}
                          <code>0.7</code> + <code>s</code> → <code>0.7s</code> (<a href="#css">CSS binding</a>).
                        </p>
                      ),
                    },
                    {
                      name: 'options',
                      type: 'Option[]',
                      children: (
                        <p>
                          Makes a select, for a string or a number value. An option is a string, a number or{' '}
                          <code>&#123; label, value &#125;</code>.
                        </p>
                      ),
                    },
                    {
                      name: 'flavour',
                      type: "'gsap' | 'css'",
                      def: 'from the value',
                      children: (
                        <p>
                          For an ease: which syntax the panel writes. A <code>css</code> rig defaults to{' '}
                          <code>&apos;css&apos;</code>. See <a href="#eases">Eases</a>.
                        </p>
                      ),
                    },
                    {
                      name: 'false',
                      type: 'instead of an object',
                      children: <p>Hides the value: it never reaches the panel.</p>,
                    },
                  ]}
                />
                <CodeBlock code={CONTROLS_EXAMPLE} label="card.ts" copy />
              </Sub>

              <Sub id="inference" title="Inference & order">
                <Props
                  label="Inferred controls"
                  rows={[
                    { name: 'boolean', type: 'toggle', children: <p>A switch.</p> },
                    {
                      name: 'number',
                      type: 'number',
                      children: (
                        <p>
                          Slider plus a numeric field. Range: <code>[0, 3×]</code> for a positive default,{' '}
                          <code>[3×, −3×]</code> for a negative one, <code>[0, 1]</code> for zero.
                        </p>
                      ),
                    },
                    { name: 'string or number + options', type: 'select', children: <p>A native select.</p> },
                    {
                      name: 'string, an ease',
                      type: 'ease',
                      children: (
                        <p>
                          A curve menu, a thumbnail and a bezier editor. See <a href="#eases">Eases</a>.
                        </p>
                      ),
                    },
                    {
                      name: 'string, a colour',
                      type: 'color',
                      children: (
                        <p>
                          <code>#rgb(a)</code>, <code>#rrggbb(aa)</code> or a colour function: <code>rgb()</code>,{' '}
                          <code>hsl()</code>, <code>hwb()</code>, <code>lab()</code>, <code>lch()</code>,{' '}
                          <code>oklab()</code>, <code>oklch()</code>, <code>color()</code>.
                        </p>
                      ),
                    },
                    { name: 'any other string', type: 'text', children: <p>A text field.</p> },
                  ]}
                />
                <p>
                  <b>Order.</b> Paths listed in <code>controls</code> come first, in the order you list them; the rest
                  follow in key order. A group sits where its first-ranked control does, so listing a key to give it a
                  unit also moves it up. Copy code always keeps your literal&apos;s own key order.
                </p>
              </Sub>

              <Sub id="eases" title="Eases">
                <p>
                  A string is an ease when it is a name from <code>configure(&#123; eases &#125;)</code>, a GSAP
                  built-in (<code>power2.out</code>, <code>back.inOut(1.7)</code>, <code>none</code>), a bare bezier{' '}
                  <code>&quot;0.25,0.1,0.25,1&quot;</code>, or CSS (<code>cubic-bezier()</code>, <code>ease-out</code>
                  , <code>linear</code>, <code>steps()</code>, <code>linear()</code>). CSS syntax is the{' '}
                  <code>css</code> flavour; everything else is <code>gsap</code>.
                </p>
                <Props
                  label="EaseDef"
                  rows={[
                    {
                      name: 'bezier',
                      type: '[x1, y1, x2, y2]',
                      children: <p>The curve. A palette entry can also be the bare tuple.</p>,
                    },
                    {
                      name: 'code',
                      type: 'string',
                      children: (
                        <p>
                          The identifier Copy code prints, e.g. <code>EASE_SETTLE</code>, so the snippet uses your
                          constant instead of a string.
                        </p>
                      ),
                    },
                    { name: 'label', type: 'string', def: 'the name', children: <p>The name in the menu.</p> },
                  ]}
                />
                <ul className={d.notes}>
                  <li>
                    A custom <code>gsap</code> curve is written as <code>&quot;x1,y1,x2,y2&quot;</code>. GSAP parses it
                    only once <code>CustomEase</code> is registered, and motionrig never imports GSAP: register it
                    yourself.
                  </li>
                  <li>
                    A custom <code>css</code> curve is written as <code>cubic-bezier(x1, y1, x2, y2)</code>; no setup.
                  </li>
                  <li>
                    The <code>css</code> menu also lists the easings.net curves (<code>easeOutQuint</code>…), matched
                    by their numbers. The editor&apos;s y range is −0.6…1.6, room for a <code>back</code> overshoot.
                  </li>
                  <li>
                    In the panel, <b>Custom curve…</b> opens the editor. Drag the two handles, or type the four numbers
                    into the field above x1…y2: <code>0.68, -0.6, 0.527, 1.6</code>, <code>.68,-.6,.527,1.6</code>,{' '}
                    <code>cubic-bezier(…)</code> and <code>[…]</code> all work, and a whole list pasted into x1 fills
                    all four. Anything else is marked invalid and changes nothing. The copy button inside the field
                    copies <code>cubic-bezier(x1, y1, x2, y2)</code>, ready for a stylesheet.
                  </li>
                </ul>
                <CodeBlock code={EASES_EXAMPLE} label="motion/eases.ts" copy />
                <p>
                  Hand the palette to <code>configure(&#123; eases: EASES &#125;)</code>, where the{' '}
                  <a href="#setup">setup</a> configures. Copy code then prints{' '}
                  <code>EASE_SETTLE</code> instead of <code>&apos;settle&apos;</code>; <code>motionrig apply</code>{' '}
                  writes the constant only where the file already imports it, the quoted name elsewhere.
                </p>
              </Sub>

              <Sub id="css" title="CSS binding">
                <p>
                  With <code>css</code>, each <em>overridden</em> leaf becomes a custom property on <code>:root</code>:{' '}
                  <code>--&#123;prefix&#125;&#123;kebab(path)&#125;</code>, so <code>enter.fadeDuration</code> is{' '}
                  <code>--enter-fade-duration</code>. Numbers get their <code>unit</code>. Defaults are never written,
                  so the stylesheet&apos;s fallback stays the source of truth, and a reset brings it back.
                </p>
                <div className={d.pair}>
                  <CodeBlock code={CSS_RIG} label="faq.ts" copy />
                  <CodeBlock code={CSS_SHEET} label="faq.css" lang="css" copy />
                </div>
                <ul className={d.notes}>
                  <li>
                    A number that lands in a length or a time needs its <code>unit</code>: a bare <code>0.7</code> is
                    not a duration, so the declaration fails and the browser drops it.
                  </li>
                  <li>
                    A string that could break out of the declaration (<code>;</code>, <code>&#123;</code>,{' '}
                    <code>&#125;</code>, a newline, <code>/*</code>, unbalanced brackets or quotes) is never written.
                  </li>
                  <li>
                    Written through one adopted stylesheet, never <code>documentElement.style</code>, so hydration is
                    untouched. <code>motionrig apply</code> patches the fallbacks in your stylesheets.
                  </li>
                  <li>
                    Recipes: a <Link href="/examples#css-transition">CSS transition</Link> and a{' '}
                    <Link href="/examples#keyframes">@keyframes loop</Link>.
                  </li>
                </ul>
              </Sub>
            </Section>

            <Section
              id="configure"
              title="configure(options)"
              lead={
                <>
                  Merges options into the config, shallowly: passing <code>eases</code> again replaces the palette.
                  Safe before or after any <code>rig()</code>, any number of times; call it first to let share links
                  apply synchronously.
                </>
              }
            >
              <Props
                label="RigConfig options"
                rows={[
                  {
                    name: 'enabled',
                    type: 'boolean',
                    def: 'the ?rig gate',
                    children: (
                      <p>
                        <code>true</code> opens the panel for every visitor (staging); <code>false</code> closes it
                        and reads nothing, <code>?rig</code> included. Unset or <code>undefined</code>, the{' '}
                        <a href="#gate">gate</a> decides. To force it on only in development, pass{' '}
                        <code>import.meta.env.DEV || undefined</code> (Vite) or{' '}
                        <code>process.env.NODE_ENV === &apos;development&apos; || undefined</code>.
                      </p>
                    ),
                  },
                  {
                    name: 'param',
                    type: 'string',
                    def: "'rig'",
                    children: (
                      <p>
                        The URL parameter that opens the panel and carries share links. Rename it if{' '}
                        <code>?rig</code> clashes with your routes: <code>param: &apos;tune&apos;</code> →{' '}
                        <code>?tune</code>.
                      </p>
                    ),
                  },
                  {
                    name: 'storageKey',
                    type: 'string',
                    def: "'motionrig'",
                    children: (
                      <p>
                        The localStorage key for tweaks (<a href="#persistence">Persistence</a>). Changing it restores
                        every rig to its code defaults first.
                      </p>
                    ),
                  },
                  {
                    name: 'locale',
                    type: "'en' | 'ru'",
                    def: "'en'",
                    children: <p>The panel&apos;s language.</p>,
                  },
                  {
                    name: 'messages',
                    type: 'Partial<Record<MessageKey, string>>',
                    children: (
                      <>
                        <p>
                          Overrides single panel strings, e.g. <code>&#123; copyCode: &apos;Copy&apos; &#125;</code>.{' '}
                          <code>&#123;n&#125;</code> and <code>&#123;m&#125;</code> are filled in, and{' '}
                          <code>tweaks</code> / <code>rigs</code> hold the plural forms, <code>|</code>-separated:{' '}
                          <code>&apos;tweak|tweaks&apos;</code> in English, one|few|many in Russian (
                          <code>&apos;правка|правки|правок&apos;</code>).
                        </p>
                        <p className={d.keys}>
                          {MESSAGE_KEYS.map((k) => (
                            <code key={k}>{k}</code>
                          ))}
                        </p>
                      </>
                    ),
                  },
                  {
                    name: 'eases',
                    type: 'Record<string, Bezier | EaseDef>',
                    children: (
                      <p>
                        Your named curves, listed first in every ease menu. See <a href="#eases">Eases</a>.
                      </p>
                    ),
                  },
                  {
                    name: 'hotkey',
                    type: 'string | false',
                    def: "'alt+r'",
                    children: (
                      <>
                        <p>
                          The shortcut that opens and collapses the panel; ignored while typing in a field.{' '}
                          <code>false</code> turns it off. <code>Escape</code> inside the panel always collapses it.
                        </p>
                        <p>
                          Write it as modifiers plus one key, joined by <code>+</code>: <code>alt</code> (or{' '}
                          <code>option</code>), <code>ctrl</code>, <code>shift</code>, <code>meta</code> (or{' '}
                          <code>cmd</code>), then a letter, a digit or a <code>KeyboardEvent.code</code> name such as{' '}
                          <code>backquote</code> or <code>f2</code>. Modifiers must match exactly. Keys are matched by
                          their physical position, so <code>alt+r</code> works on any keyboard layout, and on macOS
                          even though Option+R types ®.
                        </p>
                        <p>
                          <code>configure(&#123; hotkey: &apos;ctrl+shift+m&apos; &#125;)</code>
                        </p>
                      </>
                    ),
                  },
                  {
                    name: 'order',
                    type: 'string[]',
                    children: (
                      <p>
                        Tab ids to show first, in this order; the rest follow in registration order. Tabs the designer
                        hasn&apos;t opened yet still sort first (<a href="#tabs">Tabs</a>).
                      </p>
                    ),
                  },
                  {
                    name: 'theme',
                    type: "'dark' | 'light' | 'auto'",
                    def: "'dark'",
                    children: (
                      <p>
                        The panel&apos;s colours. <code>&apos;auto&apos;</code> follows{' '}
                        <code>prefers-color-scheme</code> live. Changing it restyles an open panel in place: no
                        remount, the tab stays. <a href="#theme">Try it</a>.
                      </p>
                    ),
                  },
                ]}
              />
              <CodeBlock code={CONFIGURE_EXAMPLE} label="instrumentation-client.ts" copy />
              <ul className={d.notes}>
                <li>Closing an open gate restores every rig to its code defaults first.</li>
              </ul>

              <Sub id="theme" title="Panel theme">
                <p>
                  The theme is set in one place, <code>configure(&#123; theme &#125;)</code>; <code>&lt;RigPanel&gt;</code>{' '}
                  takes no theme prop. The light theme keeps rig yellow as a fill and switches yellow text and thin
                  strokes to a dark amber that passes WCAG AA. Pick one; the real panel opens on this page&apos;s swatch
                  rig.
                </p>
                <ThemeDemo />
              </Sub>
            </Section>

            <Section
              id="panel"
              title="The panel"
              lead={<>What the designer sees. Everything here comes from <code>rig()</code> and its meta.</>}
            >
              <Sub id="anatomy" title="Anatomy">
                <ul className={d.notes}>
                  <li>
                    <b>Collapsed</b>, it is the ring in the bottom-left corner, with a badge counting changed values.
                    Drag it anywhere; click it or press the <a href="#configure">hotkey</a> (<code>alt+r</code>) to
                    open, <code>Escape</code> to collapse.
                  </li>
                  <li>
                    <b>Header:</b> search (by title, id, note, key or label; a pasted share link or payload is imported
                    instead), <b>Share link</b> (<a href="#share">share links</a>) and Collapse.
                  </li>
                  <li>
                    <b>Tabs:</b> one chip per rig, a yellow dot on those with tweaks (<a href="#tabs">more below</a>).
                  </li>
                  <li>
                    <b>A tab:</b> its title and badge (<a href="#applies">when an edit shows</a>), Replay or Reload,
                    Locate (<a href="#locate">Locate</a>), the note, then the controls in their groups (
                    <a href="#controls">Controls</a>). A changed value turns yellow; its ↺, or a double-click on the
                    label, puts the code default back.
                  </li>
                  <li>
                    <b>Footer:</b> <b>Copy code</b> (<a href="#share">Copy code</a>), Reset tab, and Reset all, which
                    asks for a second click within 3 s.
                  </li>
                  <li>
                    On a desktop the panel floats and drags by its header; under 560 px wide it is a bottom sheet.
                    Opening a tab with a <code>target</code> moves the panel off it. Its motion follows{' '}
                    <code>prefers-reduced-motion</code>, and its colours follow <a href="#theme">the theme</a>.
                  </li>
                </ul>
              </Sub>
              <Sub id="tabs" title="Tabs: new, +N more">
                <p>
                  <span className={d.badge} data-applies="new">
                    new
                  </span>{' '}
                  marks a rig the designer hasn&apos;t opened yet, and new tabs sort first. The ids already seen
                  live in localStorage under the storage key (<code>motionrig</code> unless{' '}
                  <code>configure(&#123; storageKey &#125;)</code> says otherwise), as <code>ui.seen</code> next to the
                  open tab. The very first time the panel opens in a browser, that list is seeded with every rig on
                  the page, so nothing is badged. A rig added to the code later keeps its badge until its tab is
                  opened.
                </p>
                <p>
                  While any tab is new, the strip ends in a <b>✓ N new</b> action. It marks every tab seen at once and
                  clears the badges in place.
                </p>
                <p>
                  With many rigs the tab strip stays at two rows. Its last slot becomes a <b>+N</b> chip (“N more” to a
                  screen reader) that expands the full list, and the expanded strip ends in <b>Less</b>; the choice is remembered. The
                  active tab and any tab with tweaks are pinned into the two visible rows, and while a search is
                  typed every match shows.
                </p>
              </Sub>
            </Section>

            <Section id="react" title="React" lead={<>From <code>motionrig/react</code>.</>}>
              <Sub id="use-rig" title="useRig(values)">
                <p>
                  Returns an immutable snapshot that changes identity only when that rig changes, so it drops straight
                  into an effect&apos;s dependencies. The server render and the first client render always use the
                  code defaults: no hydration mismatch, even with stored tweaks. Pass the object <code>rig()</code>{' '}
                  returned, not a nested part of it: <code>useRig(HERO).enter</code>, not{' '}
                  <code>useRig(HERO.enter)</code>. Behind a closed gate it returns the object itself and never
                  re-renders.
                </p>
                <p>
                  Recipes: a <Link href="/examples#motion-spring">Motion spring</Link>, a{' '}
                  <Link href="/examples#gsap-timeline">GSAP timeline</Link> rebuilt on every edit, and{' '}
                  <Link href="/examples#react-state">state-driven motion</Link>.
                </p>
                <CodeBlock code={USE_RIG} label="Hero.tsx" copy />
              </Sub>
              <Sub id="rig-panel" title="<RigPanel>">
                <p>Mounts the panel once, behind the gate, and renders nothing. Put it once near the root.</p>
                <Props
                  label="RigPanel props"
                  rows={[
                    {
                      name: 'preload',
                      type: '() => Promise<unknown>',
                      children: (
                        <p>
                          Runs before the panel builds its tabs. Import every rig-bearing module here so every tab
                          shows on every page, and share links carry every css rig. Read once, on first mount.
                        </p>
                      ),
                    },
                  ]}
                />
                <CodeBlock code={RIG_PANEL} label="components/PanelMount.tsx" copy />
              </Sub>
            </Section>

            <Section id="shipping" title="Gate & sharing">
              <Sub id="gate" title="The ?rig gate">
                <ol className={d.steps}>
                  <li>
                    <code>configure(&#123; enabled &#125;)</code> wins: <code>false</code> is always closed,{' '}
                    <code>true</code> always open (a share link is still imported).
                  </li>
                  <li>
                    Then the URL: <code>?rig</code> or any value opens it; <code>?rig=off</code>, <code>0</code> or{' '}
                    <code>false</code> closes it; a share payload opens it and is imported (
                    <a href="#share">share links</a>). The name is <code>configure(&#123; param &#125;)</code>&apos;s.
                  </li>
                  <li>
                    Otherwise a sticky flag in sessionStorage: one <code>?rig</code> keeps the panel through reloads
                    and client navigation for the rest of the tab, until <code>?rig=off</code>.
                  </li>
                </ol>
                <p className={d.callout}>
                  <b>Not a security boundary.</b> Anyone can add <code>?rig</code>. Stored and shared values are
                  type-checked against your defaults and unsafe CSS is dropped, but don&apos;t rig anything a visitor
                  shouldn&apos;t see or nudge.
                </p>
              </Sub>
              <Sub id="persistence" title="Persistence: code wins">
                <p>
                  Tweaks live in localStorage with the <em>baseline</em> each was tuned against. A tweak re-applies
                  only while your code default still equals its baseline: ship a new default and the stale tweak
                  quietly drops. The same check guards <a href="#share">share links</a> and{' '}
                  <a href="#cli">motionrig apply</a>. Blocked storage just means an in-memory session; Reset tab and
                  Reset all clear the stored tweaks.
                </p>
              </Sub>
              <Sub id="share" title="Copy code & share links">
                <p>
                  <b>Copy code</b> copies the tab as a literal to paste over your object: your key order, palette
                  eases as their constants, starting with a comment naming the rig. A css rig copies its custom
                  properties.
                </p>
                <CodeBlock code={COPY_OUTPUT} label="Copy code" />
                <p>
                  <b>Share link</b> is the link icon in the panel header, named “Share link — all tweaks”. It copies
                  the page URL with <code>?rig=</code> carrying every stored tweak of every rig, including rigs that
                  aren&apos;t on this page, each with the baseline it was tuned against, plus the css rigs&apos;
                  variable names. It is not just the open tab. The toast says what went out: “Link with 3 tweaks
                  across 2 rigs copied”.
                </p>
                <p>
                  The receiver&apos;s browser imports each link once per tab, merging it over its own stored tweaks.
                  Decoding validates every value. A tweak whose baseline no longer equals the code default (the
                  default changed since it was tuned) is dropped when its rig registers (
                  <a href="#persistence">code wins</a>).
                </p>
                <p>
                  Once the values are stored, the payload leaves the address bar: the URL becomes a bare{' '}
                  <code>?rig</code>, with other params and the hash kept. The panel stays on through the session flag,
                  and a copied or reloaded URL no longer carries the old tuning. The Next.js App Router writes the URL
                  it was served back once it hydrates, so motionrig checks again for a few seconds and strips it a
                  second time.
                </p>
                <p>
                  <b>How long a link can be.</b> Each tweak costs roughly 30–100 characters (its value plus the
                  baseline). Browsers take far more than that (Chrome 2 MB, Firefox about 65 K, Safari about 80 K); servers and messengers don&apos;t: nginx answers 414
                  past 8 KB by default, Vercel&apos;s CDN refuses URLs over 14 KB, and Telegram caps a message at 4,096
                  characters. So a link stays at or under 8,000 characters, about 80–280 tweaks. Past that,{' '}
                  <b>Share link</b> copies the raw payload instead and says so. Apply it with{' '}
                  <code>npx motionrig apply &lt;payload&gt;</code> (or a file holding it), or paste it into the
                  panel&apos;s search field: a pasted link or payload is imported as if the link had been opened.
                </p>
                <p>
                  <b>Copying without HTTPS.</b> Browsers give the Clipboard API only to HTTPS and localhost, so a phone
                  testing a plain-HTTP LAN address has none. Every copy in the panel then falls back to the older{' '}
                  <code>execCommand(&apos;copy&apos;)</code>, and if that fails too, shows the text selected in a dialog
                  to copy by hand.
                </p>
              </Sub>
              <Sub id="cli" title="CLI: motionrig apply">
                <p>
                  Finds each tuned <code>rig(&apos;id&apos;, &#123; … &#125;)</code> and patches only the values that
                  changed, plus the <code>var(--name, fallback)</code> fallbacks of css rigs. Formatting and comments
                  stay.
                </p>
                <CodeBlock code={CLI_USAGE} label="usage" lang="sh" />
                <Props
                  label="CLI arguments and flags"
                  rows={[
                    {
                      name: '<link | payload | file>',
                      type: 'argument',
                      children: (
                        <p>
                          A URL with a share payload in any query param, the raw payload, or a file holding either (or
                          the payload as JSON).
                        </p>
                      ),
                    },
                    {
                      name: '--root <dir>',
                      type: 'path',
                      def: 'cwd',
                      children: (
                        <p>
                          Where to look for <code>rig()</code> calls and stylesheets; <code>--root=dir</code> works too.
                          Skips <code>node_modules</code>, <code>dist</code>, <code>build</code>, <code>.next</code>,{' '}
                          <code>out</code> and friends.
                        </p>
                      ),
                    },
                    {
                      name: '--dry-run',
                      type: 'flag',
                      children: <p>Reports what would change and writes nothing.</p>,
                    },
                    {
                      name: '--force',
                      type: 'flag',
                      children: (
                        <p>Applies a value even when the code default no longer matches its tuned baseline.</p>
                      ),
                    },
                    { name: '--help, -h', type: 'flag', children: <p>Prints the usage.</p> },
                    { name: '--version, -v', type: 'flag', children: <p>Prints the installed version.</p> },
                  ]}
                />
                <CodeBlock code={CLI_EXAMPLE} label="terminal" lang="sh" copy copyName="Copy the apply commands" />
                <ul className={d.notes}>
                  <li>
                    Exit code <code>0</code> when everything applied, <code>1</code> when anything was not found,
                    ambiguous or skipped, <code>2</code> on bad input.
                  </li>
                  <li>
                    It reads <code>.ts .tsx .js .jsx .mjs .cjs .mts .cts</code> for rigs and{' '}
                    <code>.css .scss .sass .less</code> for fallbacks.
                  </li>
                  <li>
                    The call must be named <code>rig</code> with the id as a string literal, and a value must be a
                    literal or a bare identifier; spreads and computed keys are reported, never guessed. An id found in
                    two files is reported as ambiguous and left alone.
                  </li>
                  <li>
                    A palette ease is written as its constant (<code>EASE_SETTLE</code>) only where the file imports
                    it; elsewhere as the quoted name, with a note (<a href="#eases">Eases</a>).
                  </li>
                </ul>
              </Sub>
            </Section>

            <Section
              id="runtime"
              title="Low-level API"
              lead={
                <>
                  From <code>motionrig</code>. What <code>&lt;RigPanel&gt;</code> and <code>useRig</code> are built on,
                  for other frameworks and custom buttons.
                </>
              }
            >
              <Sub id="panel-api" title="mountPanel, openPanel, isEnabled">
                <Props
                  label="Panel functions"
                  rows={[
                    {
                      name: 'mountPanel(options?)',
                      type: 'Promise<void>',
                      children: (
                        <p>
                          Awaits <code>options.preload</code>, then lazy-loads and mounts the panel. Resolves at once on
                          the server or behind a closed gate. Idempotent: the first call wins, its{' '}
                          <code>preload</code> included.
                        </p>
                      ),
                    },
                    {
                      name: 'openPanel(id?)',
                      type: 'Promise<void>',
                      children: (
                        <p>
                          Mounts if needed and opens on tab <code>id</code>, or the last tab, moved off the rig&apos;s{' '}
                          <a href="#locate">target</a>. Wire it to a visible “Tune” button. No-op behind a closed gate.
                          It mounts without <code>preload</code>, so mount first with <code>&lt;RigPanel&gt;</code> or{' '}
                          <code>mountPanel(&#123; preload &#125;)</code>.
                        </p>
                      ),
                    },
                    {
                      name: 'isEnabled()',
                      type: 'boolean',
                      children: (
                        <p>
                          The gate, computed once per page load and again on <code>configure()</code>.
                        </p>
                      ),
                    },
                  ]}
                />
                <CodeBlock code={PANEL_API} label="tune-button.ts" copy />
              </Sub>
              <Sub id="store" title="subscribe, snapshot, defaultsOf">
                <Props
                  label="Store functions"
                  rows={[
                    {
                      name: 'subscribe(values, listener)',
                      type: '() => void',
                      children: (
                        <p>
                          Calls <code>listener</code> once per microtask after the rig changes. Returns the
                          unsubscribe. A no-op for an unknown object or a closed gate. The{' '}
                          <Link href="/examples#waapi">Web Animations recipe</Link> rebuilds on it.
                        </p>
                      ),
                    },
                    {
                      name: 'snapshot(values)',
                      type: 'T',
                      children: (
                        <p>
                          An immutable deep copy with a stable identity until the next change; what{' '}
                          <a href="#use-rig">useRig</a> returns. Behind a closed gate, the object itself.
                        </p>
                      ),
                    },
                    {
                      name: 'defaultsOf(values)',
                      type: 'T',
                      children: <p>The code defaults, whatever is tuned right now.</p>,
                    },
                  ]}
                />
                <CodeBlock code={STORE_API} label="timeline.ts" copy />
              </Sub>
            </Section>

            <Section id="faq" title="Troubleshooting">
              <dl className={d.faq}>
                <div>
                  <dt>
                    <code>?rig</code> shows no panel.
                  </dt>
                  <dd>
                    Nothing mounts it: render <a href="#rig-panel">&lt;RigPanel&gt;</a> or call{' '}
                    <a href="#panel-api">mountPanel()</a>. Then check <code>configure(&#123; enabled: false &#125;)</code>{' '}
                    and a renamed <a href="#configure">param</a>.
                  </dd>
                </div>
                <div>
                  <dt>A rig&apos;s tab is missing.</dt>
                  <dd>
                    A rig registers when its module runs, so a page that never imports it has no tab. Import every
                    rig-bearing module in <a href="#rig-panel">preload</a>.
                  </dd>
                </div>
                <div>
                  <dt>An edit doesn&apos;t show.</dt>
                  <dd>
                    The value was read once. Read it when the animation plays, give <code>replay</code>, rebuild in{' '}
                    <code>onChange</code>, or render through <code>useRig</code> (
                    <a href="#applies">when an edit shows</a>).
                  </dd>
                </div>
                <div>
                  <dt>A custom curve does nothing in GSAP.</dt>
                  <dd>
                    GSAP reads <code>&quot;x1,y1,x2,y2&quot;</code> and your named curves only once{' '}
                    <code>CustomEase</code> is registered (<a href="#eases">Eases</a>).
                  </dd>
                </div>
                <div>
                  <dt>A css rig changes nothing.</dt>
                  <dd>
                    The stylesheet must read <code>var(--name, fallback)</code> with the name the rig writes, and
                    numbers need their <code>unit</code> (<a href="#css">CSS binding</a>).
                  </dd>
                </div>
                <div>
                  <dt>A tweak vanished after a deploy.</dt>
                  <dd>
                    Its code default changed, so it was dropped on purpose (<a href="#persistence">code wins</a>).
                  </dd>
                </div>
                <div>
                  <dt>
                    <code>motionrig apply</code> says not found or ambiguous.
                  </dt>
                  <dd>
                    The id must be a string literal in one file under <code>--root</code> (<a href="#cli">CLI</a>).
                  </dd>
                </div>
              </dl>
            </Section>

            <Section
              id="internals"
              title="Under the hood"
              lead={<>What one rig does from the first import to the next reload. None of it needs configuring.</>}
            >
              <Mechanics />
              <ol className={d.steps}>
                <li>
                  <code>rig()</code> registers the object and returns it, the same identity. On the server it is the
                  identity function and registers nothing.
                </li>
                <li>
                  The <a href="#gate">gate</a> is read once per page: <code>?rig</code> in the URL opens it and sets a sticky flag in
                  sessionStorage for the rest of the tab. With the gate closed <code>rig()</code> only notes the
                  object in memory and returns it, O(1): no other storage, no DOM, and the panel is never downloaded.
                </li>
                <li>
                  With the gate open, registration clones the code defaults, then applies the stored tweaks from
                  localStorage (<code>&#123; v, overrides, baseline, ui &#125;</code>) in place. A tweak applies only
                  if its baseline equals the current code default and its type matches; otherwise it is dropped. That
                  is <a href="#persistence">“code wins”</a>.
                </li>
                <li>
                  A panel edit mutates the object in place. Subscribers, <code>useRig</code> among them, hear about it
                  once per microtask, however many values changed. The store is saved 250 ms after the last edit and
                  flushed on <code>pagehide</code> or when the tab is hidden.
                </li>
                <li>
                  Your animation reads the object when it plays, so the next play sees the value. A css rig writes its
                  custom properties to one adopted stylesheet on <code>:root</code>; your inline styles are never
                  touched.
                </li>
                <li>
                  Reload runs the same path and lands on the same values. Reset puts the code defaults back and
                  clears the stored tweaks. A <a href="#share">share link</a> is imported once per tab and then
                  stripped from the URL.
                </li>
              </ol>
            </Section>

            <Section id="types" title="Types" lead={<>Exported from <code>motionrig</code> as types.</>}>
              <CodeBlock code={TYPES} label="motionrig/index.d.ts" copy copyName="Copy the types" />
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
