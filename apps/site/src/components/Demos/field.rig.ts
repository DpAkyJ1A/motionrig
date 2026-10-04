import { rig } from 'motionrig';
import '@/motion/motion';

export const FIELD = rig(
  'field',
  { spacing: 26, length: 12, width: 1.6, color: '#ffd400', radius: 190, follow: 0.14, autopilot: true },
  {
    title: 'Cursor field',
    note:
      'The needles in the fourth demo pane turn toward your cursor. A canvas redraws them every frame and reads FIELD every frame, so edits are live and nothing re-renders. With autopilot on, a ghost cursor circles while yours is away.',
    target: '[data-rig~="field"]',
    controls: {
      spacing: { group: 'Needles', unit: 'px', min: 10, max: 64, step: 1 },
      length: { group: 'Needles', unit: 'px', min: 2, max: 40, step: 0.5, hint: 'Length at full pull' },
      width: { group: 'Needles', unit: 'px', min: 0.5, max: 6, step: 0.1 },
      color: { group: 'Needles' },
      radius: { group: 'Cursor', unit: 'px', min: 20, max: 600, step: 5, hint: 'How far the pull reaches' },
      follow: { group: 'Cursor', min: 0.01, max: 1, step: 0.01, hint: 'How fast the pull catches up; 1 is instant' },
      autopilot: { group: 'Cursor', hint: 'Circles on its own while your cursor is away' },
    },
  },
);
