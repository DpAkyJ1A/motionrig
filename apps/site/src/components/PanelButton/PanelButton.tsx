'use client';

import { openPanel } from 'motionrig';
import type { ReactNode } from 'react';
import '@/motion/motion';

/** Opens the real panel, on the tab of rig `id` when given. */
export function PanelButton({ id, className, children, label }: { id?: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <button type="button" className={className} aria-label={label} onClick={() => void openPanel(id)}>
      {children}
    </button>
  );
}
