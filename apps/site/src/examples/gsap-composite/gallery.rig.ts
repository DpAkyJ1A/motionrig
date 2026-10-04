import { rig } from 'motionrig';

// Replay switches the view of the mounted gallery. One rig has one Replay, so the latest
// mount owns it, and an unmount only clears it if it is still the owner.
let toggle: (() => void) | undefined;
export function onToggle(fn: () => void) {
  toggle = fn;
  return () => {
    if (toggle === fn) toggle = undefined;
  };
}

// One group per stage of the grid ↔ list timeline. `offset` is where a stage starts
// relative to the end of the one before it: negative overlaps, positive waits.
export const GALLERY = rig(
  'gallery',
  {
    speed: 1,
    chrome: { duration: 0.5, ease: 'power3.inOut', offset: -0.2 },
    flip: { duration: 0.8, ease: 'expo.inOut', stagger: 0.04, offset: -0.3 },
    images: { duration: 0.9, ease: 'power2.out', stagger: 0.04, zoom: 1.35, offset: -0.6 },
    cards: { duration: 0.6, ease: 'power3.out', stagger: 0.05, offset: -0.5 },
    text: { duration: 0.5, ease: 'power3.out', stagger: 0.04, rise: 12, offset: -0.35 },
  },
  {
    title: 'Grid ↔ list',
    note: 'Press Grid or List. Six stages in one GSAP timeline: text out, header, cards fly, image crops, lines and counters, text in. Each group is one stage; Text drives the first and the last.',
    applies: 'replay',
    replay: () => toggle?.(),
    target: '[data-rig~="gallery"]',
    controls: {
      // Listed in timeline order: listed paths come first in the panel, in this order.
      speed: { min: 0.2, max: 3, step: 0.05, hint: 'The whole timeline' },
      chrome: { label: 'Header', hint: 'The switch and the heading' },
      'chrome.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      'chrome.offset': { unit: 's', min: -1, max: 1, step: 0.05 },
      flip: { label: 'Cards fly', hint: 'Grid cells ↔ list rows' },
      'flip.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      'flip.stagger': { unit: 's', min: 0, max: 0.3, step: 0.005 },
      'flip.offset': { unit: 's', min: -1, max: 1, step: 0.05 },
      images: { label: 'Image crops' },
      'images.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      'images.stagger': { unit: 's', min: 0, max: 0.3, step: 0.005 },
      'images.zoom': { min: 1, max: 2, step: 0.05 },
      'images.offset': { unit: 's', min: -1.5, max: 1, step: 0.05 },
      cards: { label: 'Lines & counters' },
      'cards.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      'cards.stagger': { unit: 's', min: 0, max: 0.3, step: 0.005 },
      'cards.offset': { unit: 's', min: -1.5, max: 1, step: 0.05 },
      text: { label: 'Text' },
      'text.duration': { unit: 's', min: 0.05, max: 2, step: 0.05 },
      'text.stagger': { unit: 's', min: 0, max: 0.3, step: 0.005 },
      'text.rise': { unit: 'px', min: 0, max: 40, step: 1 },
      'text.offset': { unit: 's', min: -1.5, max: 1, step: 0.05 },
    },
  },
);
