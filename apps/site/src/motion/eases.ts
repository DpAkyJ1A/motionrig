import type { EaseDef } from 'motionrig';

/**
 * The site's named curves. The panel lists them first in every ease menu, GSAP
 * knows them by name (see motion.ts), and "Copy code" prints the `code` identifier.
 */
export const EASES = {
  settle: { bezier: [0.16, 1, 0.3, 1], code: 'EASE_SETTLE', label: 'Settle' },
  snap: { bezier: [0.76, 0, 0.24, 1], code: 'EASE_SNAP', label: 'Snap' },
  lift: { bezier: [0.34, 1.56, 0.64, 1], code: 'EASE_LIFT', label: 'Lift' },
  glide: { bezier: [0.37, 0, 0.63, 1], code: 'EASE_GLIDE', label: 'Glide' },
} satisfies Record<string, EaseDef>;

export type EaseName = keyof typeof EASES;

export const EASE_SETTLE: EaseName = 'settle';
export const EASE_SNAP: EaseName = 'snap';
export const EASE_LIFT: EaseName = 'lift';
export const EASE_GLIDE: EaseName = 'glide';
