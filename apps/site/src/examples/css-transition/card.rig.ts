import { rig } from 'motionrig';

// css: true writes each tweak to :root, path → name: card.lift is
// --card-lift. Nothing reads CARD in JavaScript; the CSS does it all.
export const CARD = rig(
  'card',
  {
    card: {
      lift: 8,
      scale: 1.02,
      shadow: 0.45,
      duration: 0.35,
      ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
  {
    title: 'Hover card',
    note: 'Hover or focus a card. Each value is a CSS custom property.',
    css: true,
    target: '[data-rig~="card"]',
    controls: {
      card: { label: 'Card' },
      'card.lift': { unit: 'px', min: -16, max: 32, step: 1 },
      'card.scale': { min: 0.9, max: 1.15, step: 0.005 },
      'card.shadow': { min: 0, max: 1, step: 0.05, hint: 'Shadow alpha' },
      'card.duration': { unit: 's', min: 0, max: 1.5, step: 0.05 },
    },
  },
);
