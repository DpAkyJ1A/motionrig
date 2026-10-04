import { rig } from 'motionrig';

/** The docs page's one rig: something to look at while you switch the panel's theme. */
export const SWATCH = rig(
  'swatch',
  { spin: 2.4, size: 76, stroke: 2, color: '#ffd400', ease: 'linear' },
  {
    title: 'Theme swatch',
    note: 'The turning ring next to the theme switch on the docs page. A css rig: each change is written to a --swatch-* custom property.',
    css: { prefix: 'swatch-' },
    target: '[data-rig~="swatch"]',
    controls: {
      spin: { unit: 's', min: 0.4, max: 8, step: 0.1, hint: 'One full turn' },
      size: { unit: 'px', min: 32, max: 140, step: 1 },
      stroke: { min: 0.5, max: 4, step: 0.1, hint: 'In the ring’s own 24-unit drawing' },
    },
  },
);
