import { rig } from 'motionrig';

export const TABS = rig(
  'tabs',
  { visualDuration: 0.45, bounce: 0.3, cycle: 1.6 },
  {
    title: 'Spring tabs',
    note: 'The pill springs to the next tab every few seconds; click one.',
    target: '[data-rig~="tabs"]',
    controls: {
      visualDuration: {
        unit: 's',
        min: 0.05,
        max: 2,
        step: 0.05,
        hint: 'How long the spring looks, not how long it rings',
      },
      bounce: { min: 0, max: 0.9, step: 0.05 },
      cycle: { unit: 's', min: 0.6, max: 5, step: 0.1, hint: 'Auto-advance' },
    },
  },
);
