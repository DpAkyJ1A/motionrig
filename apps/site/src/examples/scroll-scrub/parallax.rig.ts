import { rig } from 'motionrig';

let rebuild = () => {};

/** The component hands over its builder; every edit calls it. */
export function onRebuild(build: () => void) {
  rebuild = build;
  return () => {
    rebuild = () => {};
  };
}

export const PARALLAX = rig(
  'parallax',
  { start: 85, end: 15, scrub: 0.6, depth: 120 },
  {
    title: 'Parallax scrub',
    note: 'Scroll the page: the three layers drift apart, back ones slower.',
    // ScrollTrigger reads start and end once, when it is created, so a
    // change has to rebuild it. onChange runs once per batch of edits.
    onChange: () => rebuild(),
    target: '[data-rig~="parallax"]',
    controls: {
      start: { unit: '%', min: 0, max: 100, step: 1, hint: 'Stage top, % down' },
      end: { unit: '%', min: 0, max: 100, step: 1, hint: 'Stage bottom, % down' },
      scrub: { unit: 's', min: 0, max: 3, step: 0.05, hint: '0 locks it' },
      depth: { unit: 'px', min: 0, max: 300, step: 5, hint: 'Front layer' },
    },
  },
);
