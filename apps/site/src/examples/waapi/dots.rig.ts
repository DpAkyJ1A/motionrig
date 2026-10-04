import { rig } from 'motionrig';

// WAAPI takes milliseconds and CSS easing strings, so the rig does too:
// a cubic-bezier() default makes the panel write CSS curves.
export const DOTS = rig(
  'dots',
  {
    duration: 1100,
    stagger: 140,
    height: 10,
    easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
  },
  {
    title: 'Typing dots',
    note: 'Three dots bounce in turn, made with element.animate().',
    target: '[data-rig~="dots"]',
    controls: {
      duration: { unit: 'ms', min: 200, max: 3000, step: 10 },
      stagger: { unit: 'ms', min: 0, max: 600, step: 10 },
      height: { unit: 'px', min: 0, max: 30, step: 1 },
    },
  },
);
