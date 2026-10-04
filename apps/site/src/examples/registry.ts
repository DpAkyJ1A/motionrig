/**
 * The recipes on /examples, in page order. Strings only: the page (a Server
 * Component) reads each file from disk, and the demos map lives client side.
 * `when` marks code with backticks. `files` lists what the recipe touches, the
 * existing code first, the new rig file last; a file with a copy in `before/` is a
 * change to existing code, one without is new.
 */
export type Example = {
  slug: string;
  rig: string;
  title: string;
  nav: string;
  engine: string;
  when: string;
  files: string[];
  /** The docs sections the recipe leans on: label and /docs anchor. */
  docs: [string, string][];
  /** The hardest recipe: marked with the hellfire badge here and in the side menu. */
  hot?: boolean;
};

export const EXAMPLES: Example[] = [
  {
    slug: 'css-transition',
    rig: 'card',
    title: 'A plain CSS transition',
    nav: 'CSS transition',
    engine: 'transition',
    when: 'Hover and focus states with no JavaScript: `css: true` turns each value into a custom property, and `unit` gives it its px or s.',
    files: ['Card.module.css', 'Cards.tsx', 'card.rig.ts'],
    docs: [['CSS binding', 'css'], ['unit', 'controls'], ['Locate', 'locate']],
  },
  {
    slug: 'keyframes',
    rig: 'pulse',
    title: 'A CSS @keyframes loop',
    nav: 'CSS @keyframes',
    engine: '@keyframes',
    when: 'Loaders, pulses and marquees: duration, stagger and easing go in through `var()`, and so does the scale inside `@keyframes`.',
    files: ['Pulse.module.css', 'Pulse.tsx', 'pulse.rig.ts'],
    docs: [['CSS binding', 'css'], ['css prefix', 'meta']],
  },
  {
    slug: 'gsap-from',
    rig: 'feed',
    title: 'A GSAP entrance with replay',
    nav: 'GSAP entrance',
    engine: 'gsap.from()',
    when: 'One-shot entrances: read the rig when the tween is made, and give the designer `replay` to see each edit.',
    files: ['Feed.tsx', 'feed.rig.ts'],
    docs: [['replay', 'applies'], ['Eases', 'eases']],
  },
  {
    slug: 'gsap-timeline',
    rig: 'toast',
    title: 'A GSAP timeline in steps',
    nav: 'GSAP timeline',
    engine: 'gsap.timeline()',
    when: 'Choreography: one nested group per step, each with its own duration and ease, rebuilt from `useRig` on every edit.',
    files: ['Toast.tsx', 'toast.rig.ts'],
    docs: [['useRig', 'use-rig'], ['Groups', 'controls']],
  },
  {
    slug: 'scroll-scrub',
    rig: 'parallax',
    title: 'A ScrollTrigger scrub',
    nav: 'ScrollTrigger scrub',
    engine: 'ScrollTrigger',
    when: 'Scroll-linked motion: start, end and scrub are baked in at creation, so `onChange` rebuilds the trigger.',
    files: ['Parallax.tsx', 'parallax.rig.ts'],
    docs: [['onChange', 'meta'], ['When an edit shows', 'applies']],
  },
  {
    slug: 'motion-spring',
    rig: 'tabs',
    title: 'A Motion spring',
    nav: 'Motion spring',
    engine: 'motion/react',
    when: 'Motion (Framer Motion) components: transition props are render values, so `useRig` feeds them and an edit re-renders.',
    files: ['Tabs.tsx', 'tabs.rig.ts'],
    docs: [['useRig', 'use-rig']],
  },
  {
    slug: 'waapi',
    rig: 'dots',
    title: 'Web Animations API',
    nav: 'element.animate()',
    engine: 'element.animate()',
    when: 'Native, dependency-free loops: `subscribe()` says when to make new Animations from the tuned values.',
    files: ['Dots.tsx', 'dots.rig.ts'],
    docs: [['subscribe', 'store'], ['Eases', 'eases']],
  },
  {
    slug: 'canvas',
    rig: 'wave',
    title: 'A canvas render loop',
    nav: 'Canvas loop',
    engine: 'canvas 2D',
    when: 'Anything drawn per frame (canvas, WebGL uniforms): read the rig inside the loop and edits show on the next frame.',
    files: ['Wave.tsx', 'wave.rig.ts'],
    docs: [['When an edit shows', 'applies']],
  },
  {
    slug: 'react-state',
    rig: 'accordion',
    title: 'React state-driven motion',
    nav: 'React state',
    engine: 'React state',
    when: 'Motion that follows React state, like an accordion: state changes the layout once, then the rows glide on transforms timed by `useRig`, so no frame re-runs layout. An edit shows on the next toggle.',
    files: ['Accordion.tsx', 'accordion.rig.ts'],
    docs: [['useRig', 'use-rig'], ['When an edit shows', 'applies']],
  },
  {
    slug: 'gsap-composite',
    rig: 'gallery',
    title: 'A six-stage GSAP composite',
    nav: 'GSAP composite',
    engine: 'gsap.timeline() · 6 stages',
    when: 'Big choreography, rigged in one sitting: grid ↔ list in six stages. One nested group per stage with its duration, ease, stagger and an `offset` that becomes its position parameter (Text drives both the first and the last stage), plus a global `speed`. The designer tunes each stage directly, and nobody spends an hour explaining “make the second bit snappier”.',
    files: ['Gallery.tsx', 'gallery.rig.ts'],
    docs: [['Groups', 'controls'], ['Order', 'inference'], ['replay', 'applies']],
    hot: true,
  },
];
