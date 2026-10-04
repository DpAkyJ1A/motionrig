import { rig } from 'motionrig';
import '@/motion/motion';

export const HOVER = rig(
  'hover',
  {
    lift: 14,
    scale: 1.03,
    tilt: -2.5,
    turn: 90,
    duration: 0.5,
    ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    glow: '#ffd400',
  },
  {
    title: 'Hover card',
    note:
      'The three cards in the third demo pane: hover one, or tap it on a phone. This is a css rig, so there is no JavaScript animation at all: each change becomes a custom property on :root (lift → --hover-lift) and the stylesheet reads it with var(--hover-lift, 14px). Live.',
    css: { prefix: 'hover-' },
    target: '[data-rig~="hover"]',
    controls: {
      lift: { group: 'Pose', unit: 'px', min: -40, max: 40, step: 1 },
      scale: { group: 'Pose', min: 0.8, max: 1.3, step: 0.01 },
      tilt: { group: 'Pose', unit: 'deg', min: -20, max: 20, step: 0.5 },
      turn: { group: 'Pose', unit: 'deg', min: -360, max: 360, step: 5, hint: 'How far the ring’s notch turns' },
      duration: { group: 'Transition', unit: 's', min: 0, max: 2, step: 0.05 },
      ease: { group: 'Transition' },
      glow: { group: 'Look', hint: 'Outline colour of the lifted card' },
    },
  },
);
