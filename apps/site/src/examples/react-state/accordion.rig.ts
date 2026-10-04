import { rig } from 'motionrig';

export const ACCORDION = rig(
  'accordion',
  {
    duration: 0.45,
    ease: 'cubic-bezier(0.65, 0, 0.35, 1)',
    fade: 0.25,
    delay: 0.1,
  },
  {
    title: 'Accordion',
    note: 'Open a row: the rows below glide into place, then the answer fades in. An edit shows on the next toggle.',
    applies: 'replay',
    target: '[data-rig~="accordion"]',
    controls: {
      duration: { unit: 's', min: 0, max: 1.5, step: 0.05, hint: 'Rows glide' },
      fade: { unit: 's', min: 0, max: 1, step: 0.05, hint: 'Text fade' },
      delay: { unit: 's', min: 0, max: 0.6, step: 0.05, hint: 'Text waits' },
    },
  },
);
