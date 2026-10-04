import { rig } from 'motionrig';

let play = () => {};

/** The feed registers its player here; ▶ Replay in the panel calls it. */
export function onReplay(player: () => void) {
  play = player;
  return () => {
    play = () => {};
  };
}

export const replayFeed = () => play();

export const FEED = rig(
  'feed',
  { y: 28, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
  {
    title: 'Feed entrance',
    note: 'The list fades up once when it scrolls into view.',
    applies: 'replay',
    replay: replayFeed,
    target: '[data-rig~="feed"]',
    controls: {
      y: { unit: 'px', min: -80, max: 80, step: 1 },
      duration: { unit: 's', min: 0.1, max: 2.5, step: 0.05 },
      stagger: { unit: 's', min: 0, max: 0.4, step: 0.01 },
    },
  },
);
