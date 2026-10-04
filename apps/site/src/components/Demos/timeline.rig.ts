import { rig } from 'motionrig';
import { EASE_GLIDE, EASE_SNAP } from '@/motion/eases';
import '@/motion/motion';

export const TIMELINE = rig(
  'timeline',
  {
    bars: 9,
    rise: { duration: 0.7, stagger: 0.06, ease: EASE_SNAP },
    travel: { duration: 1.6, overlap: 0.35, ease: EASE_GLIDE },
    settle: { duration: 0.5, stagger: 0.04, overlap: 0.1, ease: 'power2.in' },
    hold: 0.5,
    yoyo: false,
  },
  {
    title: 'Timeline',
    note:
      'The looping sequence in the first demo pane: bars rise, the ring travels over them, everything settles. It is one gsap.timeline() rebuilt from these values after every edit, so changes show right away. Overlap starts a step before the previous one ends; watch the strip under the pane.',
    target: '[data-rig~="timeline"]',
    controls: {
      bars: { min: 3, max: 16, step: 1, hint: 'Rendered by React from useRig()' },
      rise: { label: 'Rise' },
      'rise.duration': { unit: 's', min: 0.05, max: 3, step: 0.05 },
      'rise.stagger': { unit: 's', min: 0, max: 0.4, step: 0.01 },
      travel: { label: 'Travel' },
      'travel.duration': { unit: 's', min: 0.1, max: 5, step: 0.05 },
      'travel.overlap': { unit: 's', min: -1, max: 2, step: 0.05, hint: 'Negative leaves a gap' },
      settle: { label: 'Settle' },
      'settle.duration': { unit: 's', min: 0.05, max: 3, step: 0.05 },
      'settle.stagger': { unit: 's', min: 0, max: 0.4, step: 0.01 },
      'settle.overlap': { unit: 's', min: -1, max: 2, step: 0.05 },
      hold: { unit: 's', min: 0, max: 3, step: 0.05, group: 'Loop', hint: 'Pause before the next loop' },
      yoyo: { group: 'Loop', hint: 'Play backwards on every other loop' },
    },
  },
);
