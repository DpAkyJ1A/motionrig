import { rig } from 'motionrig';
import { EASE_SETTLE } from '@/motion/eases';
import { prefersReducedMotion } from '@/motion/motion';

let replay = (): void => {};

/** The stage registers its player here, so the panel's ▶ Replay and the page's button share it. */
export function setHeroReplay(play: () => void): () => void {
  replay = play;
  return () => {
    if (replay === play) replay = () => {};
  };
}

export const replayHero = (): void => replay();

let pending: ReturnType<typeof setTimeout> | undefined;

/** A dragged slider fires on every step; replay once it settles. Reduced motion keeps Replay as the only trigger. */
function replaySoon(): void {
  if (prefersReducedMotion()) return;
  clearTimeout(pending);
  pending = setTimeout(replay, 150);
}

export const HERO = rig(
  'hero',
  {
    split: 'chars',
    from: 'start',
    stagger: 0.028,
    duration: 1.1,
    ease: EASE_SETTLE,
    rise: 110,
    tilt: -75,
    spin: 6,
    ring: {
      draw: 1.8,
      delay: 0.15,
      turn: 120,
    },
  },
  {
    title: 'Hero headline',
    note:
      'The headline at the top of the page. Its letters rise, tip up off the floor and settle. Every edit replays it, and so does Replay. Rise is how far each piece travels in % of its own height, tilt tips it forward like a door hinged on the floor, spin turns it in the page plane.',
    // Every edit replays the headline (onChange), so it shows live; Replay stays for a second look.
    applies: 'live',
    replay: () => replay(),
    onChange: replaySoon,
    target: '[data-rig~="hero"]',
    controls: {
      split: {
        group: 'Pieces',
        hint: 'What moves as one piece',
        options: [
          { label: 'letters', value: 'chars' },
          { label: 'words', value: 'words' },
        ],
      },
      from: { group: 'Pieces', hint: 'Where the stagger starts', options: ['start', 'center', 'end', 'edges', 'random'] },
      stagger: { group: 'Pieces', unit: 's', min: 0, max: 0.2, step: 0.002, hint: 'Gap between one piece and the next' },
      duration: { group: 'Motion', unit: 's', min: 0.1, max: 3, step: 0.05 },
      ease: { group: 'Motion' },
      rise: { group: 'Motion', unit: '%', min: -300, max: 300, step: 5 },
      tilt: { group: 'Motion', unit: '°', min: -180, max: 180, step: 1 },
      spin: { group: 'Motion', unit: '°', min: -180, max: 180, step: 1 },
      ring: { label: 'Root ring', hint: 'The yellow control ring on the floor' },
      'ring.draw': { unit: 's', min: 0, max: 4, step: 0.05, hint: 'How long the stroke takes to close' },
      'ring.delay': { unit: 's', min: 0, max: 2, step: 0.05 },
      'ring.turn': { unit: '°', min: -360, max: 360, step: 5, hint: 'How far the notch travels while drawing' },
    },
  },
);

export const TYPE = rig(
  'type',
  { width: 118, weight: 780, tracking: -0.035 },
  {
    title: 'Display type',
    note:
      'Every big heading on the page is set in Anybody, a variable font. Its width and weight are numbers like any other, so they are rigged too: this is a css rig, so each change is written to a CSS custom property (--type-width, --type-weight, --type-tracking) and shows immediately.',
    css: { prefix: 'type-' },
    target: '[data-rig~="type"]',
    controls: {
      width: { unit: '%', min: 50, max: 150, step: 1, hint: 'font-stretch: Anybody goes from 50% to 150%' },
      weight: { min: 100, max: 900, step: 10, hint: 'font-weight' },
      tracking: { unit: 'em', min: -0.12, max: 0.12, step: 0.005, hint: 'letter-spacing' },
    },
  },
);
