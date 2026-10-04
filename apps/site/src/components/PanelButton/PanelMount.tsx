'use client';

import { RigPanel } from 'motionrig/react';
// configure() must have run before the panel checks the gate.
import '@/motion/motion';

export function PanelMount() {
  return <RigPanel />;
}
