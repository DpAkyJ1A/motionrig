import { rig } from 'motionrig';

export const WAVE = rig(
  'wave',
  {
    lines: 6,
    amplitude: 34,
    frequency: 1.6,
    speed: 1.2,
    spread: 0.5,
    width: 1.5,
    color: '#ffd400',
  },
  {
    title: 'Canvas wave',
    note: 'Sine lines drawn every frame. Every value is read per frame.',
    target: '[data-rig~="wave"]',
    controls: {
      lines: { min: 1, max: 16, step: 1 },
      amplitude: { unit: 'px', min: 0, max: 90, step: 1 },
      frequency: { min: 0.2, max: 6, step: 0.1, hint: 'Waves across' },
      speed: { min: -4, max: 4, step: 0.1 },
      spread: { min: 0, max: 2, step: 0.05, hint: 'Phase between lines' },
      width: { unit: 'px', min: 0.5, max: 5, step: 0.1 },
    },
  },
);
