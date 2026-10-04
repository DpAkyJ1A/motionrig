import { rig } from 'motionrig';

// A css rig with a prefix: duration → --pulse-duration. The keyframes
// and the animation shorthand read them through var(), with fallbacks.
export const PULSE = rig(
  'pulse',
  {
    duration: 2.4,
    stagger: 0.8,
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    scale: 9,
  },
  {
    title: 'Pulse loop',
    note: 'Three rings leave the dot one after another, forever.',
    css: { prefix: 'pulse-' },
    target: '[data-rig~="pulse"]',
    controls: {
      duration: { unit: 's', min: 0.3, max: 6, step: 0.1 },
      stagger: { unit: 's', min: 0, max: 2, step: 0.05, hint: 'Ring to ring' },
      scale: { min: 2, max: 16, step: 0.5, hint: 'How far a ring grows' },
    },
  },
);
