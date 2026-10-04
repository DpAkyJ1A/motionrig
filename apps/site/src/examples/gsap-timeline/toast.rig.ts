import { rig } from 'motionrig';

// One group per step of the timeline: each nested object is a group in
// the panel, with its own duration and ease.
export const TOAST = rig(
  'toast',
  {
    enter: { duration: 0.7, ease: 'expo.out' },
    lines: { delay: 0.2, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
    progress: { duration: 1.8, ease: 'none' },
    exit: { duration: 0.45, ease: 'power2.in' },
    hold: 0.6,
  },
  {
    title: 'Toast sequence',
    note: 'Slides in, writes its lines, counts down, leaves. Loops.',
    target: '[data-rig~="toast"]',
    controls: {
      enter: { label: 'Enter' },
      'enter.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      lines: { label: 'Lines' },
      'lines.delay': {
        unit: 's',
        min: 0,
        max: 1.5,
        step: 0.05,
        hint: 'After Enter starts',
      },
      'lines.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      'lines.stagger': { unit: 's', min: 0, max: 0.4, step: 0.01 },
      progress: { label: 'Countdown' },
      'progress.duration': { unit: 's', min: 0.2, max: 5, step: 0.1 },
      exit: { label: 'Exit' },
      'exit.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      hold: { unit: 's', min: 0, max: 3, step: 0.1, hint: 'Between loops' },
    },
  },
);
