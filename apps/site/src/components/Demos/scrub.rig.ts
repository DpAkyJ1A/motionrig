import { rig } from 'motionrig';
import '@/motion/motion';

export const SCRUB = rig(
  'scrub',
  { smooth: 0.8, start: 70, end: 50, spin: 720, ease: 'none', markers: false },
  {
    title: 'Scroll scrub',
    note:
      'The ring in the second demo pane rolls along its ruler as you scroll the page past it; it is a ScrollTrigger with scrub, rebuilt after every edit. Smooth is how long the ring takes to catch up with the scrollbar. Start and end say where in the viewport the ride begins and ends. Turn on markers to see them.',
    target: '[data-rig~="scrub"]',
    controls: {
      smooth: { unit: 's', min: 0, max: 3, step: 0.05, hint: 'scrub: 0 locks the ring to the scrollbar' },
      start: { group: 'Range', unit: '%', min: 0, max: 100, step: 1, hint: 'Starts when the pane’s top is this far down the viewport' },
      end: { group: 'Range', unit: '%', min: 0, max: 100, step: 1, hint: 'Ends when the pane’s bottom is this far down the viewport' },
      spin: { group: 'Ring', unit: '°', min: -1440, max: 1440, step: 10, hint: 'Rotation over the whole ride' },
      ease: { group: 'Ring', hint: 'Maps scroll progress to position; none keeps it 1:1' },
      markers: { hint: 'Draws ScrollTrigger’s start and end markers on the page' },
    },
  },
);
